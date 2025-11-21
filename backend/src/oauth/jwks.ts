// JWKS (JSON Web Key Set) Management
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

export interface JWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n?: string;
  e?: string;
  crv?: string;
  x?: string;
  y?: string;
}

export interface KeyPair {
  publicKey: jose.KeyLike;
  privateKey: jose.KeyLike;
  kid: string;
  jwk: JWK;
}

class JWKSManager {
  private keyPair: KeyPair | null = null;

  async generateKeyPair(): Promise<KeyPair> {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
    });

    const kid = uuidv4();
    const jwk = await jose.exportJWK(publicKey);

    const publicJWK: JWK = {
      kty: jwk.kty || 'RSA',
      kid,
      use: 'sig',
      alg: 'RS256',
      n: jwk.n,
      e: jwk.e,
    };

    this.keyPair = {
      publicKey,
      privateKey,
      kid,
      jwk: publicJWK,
    };

    return this.keyPair;
  }

  async getOrCreateKeyPair(): Promise<KeyPair> {
    if (!this.keyPair) {
      await this.generateKeyPair();
    }
    return this.keyPair!;
  }

  async getPublicJWKS(): Promise<{ keys: JWK[] }> {
    const keyPair = await this.getOrCreateKeyPair();
    return {
      keys: [keyPair.jwk],
    };
  }

  async getPrivateKey(): Promise<{ key: jose.KeyLike; kid: string }> {
    const keyPair = await this.getOrCreateKeyPair();
    return {
      key: keyPair.privateKey,
      kid: keyPair.kid,
    };
  }

  async signJWT(payload: any, expiresIn: string = '1h'): Promise<string> {
    const { key, kid } = await this.getPrivateKey();

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid, typ: 'JWT' })
      .setIssuedAt()
      .setIssuer(process.env.ISSUER || 'http://localhost:4000')
      .setExpirationTime(expiresIn)
      .sign(key);

    return jwt;
  }

  async verifyJWT(token: string): Promise<jose.JWTPayload> {
    const keyPair = await this.getOrCreateKeyPair();
    const { payload } = await jose.jwtVerify(token, keyPair.publicKey, {
      issuer: process.env.ISSUER || 'http://localhost:4000',
    });
    return payload;
  }

  // Verify external JWT using JWKS from external provider
  async verifyExternalJWT(token: string, jwksUri: string, issuer: string): Promise<jose.JWTPayload> {
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer,
    });
    return payload;
  }
}

export const jwksManager = new JWKSManager();

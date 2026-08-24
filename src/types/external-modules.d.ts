// AfriBayit — Ambient type declarations for server-side packages that are
// imported by restored backend code but not listed in package.json.
//
// Why this file exists:
//   The "restore-backend" branch restores backend source files (lib/redis.ts,
//   lib/notifications/channels/push.ts, lib/payments/providers/stripe.ts,
//   lib/storage/r2.ts, lib/twofa.ts, etc.) that import third-party SDKs which
//   were previously installed in the full-stack monorepo but were stripped
//   from package.json during the "separate frontend from backend" refactor.
//
//   In production, these packages are installed on the NestJS backend
//   service (Railway/Fly.io) — the Next.js frontend never actually imports
//   them at runtime because the corresponding code paths are only entered
//   server-side via API routes that proxy to the backend. The TypeScript
//   compiler, however, needs to resolve the module types.
//
//   Installing the real packages here would balloon the frontend bundle
//   size with server-only deps (aws-sdk, stripe, etc.). Declaring them
//   loosely (using `any`) lets the restored backend source compile and
//   type-check while keeping the frontend install footprint small. The
//   actual runtime resolution happens on the backend service.
//
// If you need stronger typing for one of these modules, install it as a
// dev dependency (`npm install -D @types/foo` or `npm install -D foo`)
// and remove the corresponding `declare module` entry below.

declare module '@upstash/redis' {
  // The real @upstash/redis exports `Redis` (class), `RedisConfig`, etc.
  // We expose a permissive class with a generic `get<T>` method so the
  // restored lib/cache/redis.ts and lib/redis.ts compile. The actual
  // runtime behavior is provided by the real package on the backend.
  export class Redis {
    constructor(config?: Record<string, unknown>);
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, opts?: Record<string, unknown>): Promise<string>;
    del(...keys: string[]): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    hget<T = unknown>(key: string, field: string): Promise<T | null>;
    hset<T = unknown>(key: string, field: string, value: T): Promise<number>;
    hgetall<T = unknown>(key: string): Promise<Record<string, T>>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    sadd(key: string, ...members: unknown[]): Promise<number>;
    srem(key: string, ...members: unknown[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: unknown): Promise<boolean>;
    zadd(key: string, score: number, member: unknown): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrem(key: string, ...members: unknown[]): Promise<number>;
    pipeline(): { [key: string]: any };
    multi(): { [key: string]: any };
    static fromEnv(): Redis;
  }
  export type RedisConfig = any;
  const _default: any;
  export default _default;
}

declare module 'resend' {
  // Real `resend` exports `Resend` class default + various types.
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send: (options: Record<string, unknown>) => Promise<any>;
    };
  }
  export default Resend;
}

declare module 'web-push' {
  export type PushSubscription = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  export type VapidKeys = { publicKey: string; privateKey: string };
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;
  export function generateVAPIDKeys(): VapidKeys;
  export function sendNotification(
    subscription: PushSubscription | string,
    payload?: string | Buffer,
    options?: Record<string, unknown>
  ): Promise<{ statusCode: number; body?: string; headers?: Record<string, string> }>;
  const _default: {
    setVapidDetails: typeof setVapidDetails;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    sendNotification: typeof sendNotification;
  };
  export default _default;
}

declare module 'fedapay' {
  // Real `fedapay` exports `FedaPay`, `Transaction`, `Payout`, `Customer`,
  // `Webhook`, etc. as named exports. We expose `any` for all of them so
  // the restored backend code (lib/payments/fedapay-client.ts) compiles.
  export const FedaPay: any;
  export const Transaction: any;
  export const Payout: any;
  export const Customer: any;
  export const Webhook: any;
  export const Page: any;
  export const Event: any;
  const _default: any;
  export default _default;
}

declare module 'stripe' {
  // Real `stripe` exports the `Stripe` class as default + a `Stripe`
  // namespace (used as `Stripe.Charge`, `Stripe.Customer`, etc.).
  // We expose `any` for both the value and namespace forms so all
  // restored-backend usages compile.
  const Stripe: any;
  export default Stripe;
  export type Stripe = any;
  namespace Stripe {
    export type Charge = any;
    export type Customer = any;
    export type PaymentIntent = any;
    export type PaymentIntentConfirmParams = any;
    export type PaymentIntentCreateParams = any;
    export type Refund = any;
    export type RefundCreateParams = any;
    export type Payout = any;
    export type PayoutCreateParams = any;
    export type Account = any;
    export type AccountCreateParams = any;
    export type Checkout = any;
    export type CheckoutSessionCreateParams = any;
    export type Subscription = any;
    export type Event = any;
    export type WebhookEndpoint = any;
    export type Token = any;
    export type Source = any;
    export type File = any;
    export type FileCreateParams = any;
    export type Balance = any;
    export type BalanceTransaction = any;
    export type PaymentMethod = any;
    export type SetupIntent = any;
    export type Transfer = any;
    export type TransferCreateParams = any;
    export type CustomerBalanceTransaction = any;
    export type Invoice = any;
    export type InvoiceItem = any;
    export type Price = any;
    export type Product = any;
    export type PromotionCode = any;
    export type Coupon = any;
  }
}

declare module 'socket.io' {
  // Real `socket.io` exports `Server`, `Namespace`, `Socket`, etc. with a
  // rich API surface. We expose permissive `any`-typed classes so the
  // restored lib/realtime/server.ts (which uses socket.id, socket.data,
  // socket.use, io.sockets.adapter, etc.) compiles without a hard dep on
  // the real types.
  export class Server {
    [key: string]: any;
    constructor(server?: unknown, opts?: Record<string, unknown>);
  }
  export class Socket {
    [key: string]: any;
  }
  export class Namespace {
    [key: string]: any;
  }
  const _default: { Server: typeof Server; Socket: typeof Socket; Namespace: typeof Namespace };
  export default _default;
}

declare module '@aws-sdk/client-s3' {
  // Real @aws-sdk/client-s3 exports S3Client + many command classes.
  // We expose permissive shapes so the restored lib/storage/r2.ts compiles.
  export class S3Client {
    constructor(config?: Record<string, unknown>);
    send(command: unknown): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class GetObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class DeleteObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class HeadObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class ListObjectsV2Command {
    constructor(input: Record<string, unknown>);
  }
}

declare module '@aws-sdk/s3-request-presigner' {
  // Real @aws-sdk/s3-request-presigner exports @aws-sdk/types
  // PresignedUrlGenerator, getSignedUrl, etc. We expose the surface used
  // by lib/storage/r2.ts (getSignedUrl + the S3 command classes which are
  // re-exported for convenience).
  export class GetObjectCommand extends Object {
    constructor(input: Record<string, unknown>);
  }
  export class PutObjectCommand extends Object {
    constructor(input: Record<string, unknown>);
  }
  export const getSignedUrl: (
    client: unknown,
    command: unknown,
    options?: Record<string, unknown>
  ) => Promise<string>;
}

declare module 'otpauth' {
  // Real `otpauth` exports Secret, TOTP, HOTP, URI, etc.
  export class Secret {
    constructor(opts?: Record<string, unknown>);
    base32: string;
    hex: string;
    utf8: string;
  }
  export class TOTP {
    constructor(opts?: Record<string, unknown>);
    generate(): string;
    validate(args: Record<string, unknown>): number | null;
    toString(): string;
  }
  export class HOTP {
    constructor(opts?: Record<string, unknown>);
    generate(counter?: number): string;
    validate(args: Record<string, unknown>): number | null;
    toString(): string;
  }
  export const URI: {
    stringify: (totp: TOTP) => string;
    parse: (uri: string) => TOTP;
  };
}

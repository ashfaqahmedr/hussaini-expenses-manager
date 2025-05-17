declare module "auth" {
  import { Session } from "@auth/core/types"
  import { RequestInternal } from "@auth/core/types"
  import { AuthConfig } from "@auth/core"

  export const auth: (request?: RequestInternal) => Promise<Session | null>
  export const handlers: (config: AuthConfig) => {
    GET: any
    POST: any
  }
}

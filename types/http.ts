
export const EnumHttpMethods = ({
  GET: 'GET',
  PUT: 'PUT',
  HEAD: 'HEAD',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
}) as const

export type HttpMethod  = typeof EnumHttpMethods
export type HttpMethods = HttpMethod[keyof typeof EnumHttpMethods]

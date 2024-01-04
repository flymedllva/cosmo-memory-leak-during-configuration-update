// @generated by protoc-gen-es v1.4.1 with parameter "target=ts"
// @generated from file wg/cosmo/common/common.proto (package wg.cosmo.common, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { proto3 } from "@bufbuild/protobuf";

/**
 * @generated from enum wg.cosmo.common.EnumStatusCode
 */
export enum EnumStatusCode {
  /**
   * @generated from enum value: OK = 0;
   */
  OK = 0,

  /**
   * @generated from enum value: ERR = 1;
   */
  ERR = 1,

  /**
   * @generated from enum value: ERR_NOT_FOUND = 2;
   */
  ERR_NOT_FOUND = 2,

  /**
   * @generated from enum value: ERR_ALREADY_EXISTS = 3;
   */
  ERR_ALREADY_EXISTS = 3,

  /**
   * @generated from enum value: ERR_INVALID_SUBGRAPH_SCHEMA = 4;
   */
  ERR_INVALID_SUBGRAPH_SCHEMA = 4,

  /**
   * @generated from enum value: ERR_SUBGRAPH_COMPOSITION_FAILED = 5;
   */
  ERR_SUBGRAPH_COMPOSITION_FAILED = 5,

  /**
   * @generated from enum value: ERR_SUBGRAPH_CHECK_FAILED = 6;
   */
  ERR_SUBGRAPH_CHECK_FAILED = 6,

  /**
   * @generated from enum value: ERR_INVALID_LABELS = 7;
   */
  ERR_INVALID_LABELS = 7,

  /**
   * @generated from enum value: ERR_ANALYTICS_DISABLED = 8;
   */
  ERR_ANALYTICS_DISABLED = 8,

  /**
   * @generated from enum value: ERROR_NOT_AUTHENTICATED = 9;
   */
  ERROR_NOT_AUTHENTICATED = 9,

  /**
   * @generated from enum value: ERR_OPENAI_DISABLED = 10;
   */
  ERR_OPENAI_DISABLED = 10,

  /**
   * @generated from enum value: ERR_FREE_TRIAL_EXPIRED = 11;
   */
  ERR_FREE_TRIAL_EXPIRED = 11,

  /**
   * @generated from enum value: ERROR_NOT_AUTHORIZED = 12;
   */
  ERROR_NOT_AUTHORIZED = 12,

  /**
   * @generated from enum value: ERR_LIMIT_REACHED = 13;
   */
  ERR_LIMIT_REACHED = 13,
}
// Retrieve enum metadata with: proto3.getEnumType(EnumStatusCode)
proto3.util.setEnumType(EnumStatusCode, "wg.cosmo.common.EnumStatusCode", [
  { no: 0, name: "OK" },
  { no: 1, name: "ERR" },
  { no: 2, name: "ERR_NOT_FOUND" },
  { no: 3, name: "ERR_ALREADY_EXISTS" },
  { no: 4, name: "ERR_INVALID_SUBGRAPH_SCHEMA" },
  { no: 5, name: "ERR_SUBGRAPH_COMPOSITION_FAILED" },
  { no: 6, name: "ERR_SUBGRAPH_CHECK_FAILED" },
  { no: 7, name: "ERR_INVALID_LABELS" },
  { no: 8, name: "ERR_ANALYTICS_DISABLED" },
  { no: 9, name: "ERROR_NOT_AUTHENTICATED" },
  { no: 10, name: "ERR_OPENAI_DISABLED" },
  { no: 11, name: "ERR_FREE_TRIAL_EXPIRED" },
  { no: 12, name: "ERROR_NOT_AUTHORIZED" },
  { no: 13, name: "ERR_LIMIT_REACHED" },
]);

/**
 * @generated from enum wg.cosmo.common.GraphQLSubscriptionProtocol
 */
export enum GraphQLSubscriptionProtocol {
  /**
   * Subscribe with a websocket, automatically negotiating the subprotocol
   *
   * @generated from enum value: GRAPHQL_SUBSCRIPTION_PROTOCOL_WS = 0;
   */
  GRAPHQL_SUBSCRIPTION_PROTOCOL_WS = 0,

  /**
   * Subscribe via SSE with a GET request
   *
   * @generated from enum value: GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE = 1;
   */
  GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE = 1,

  /**
   * Subscribe via SSE with a POST request
   *
   * @generated from enum value: GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE_POST = 2;
   */
  GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE_POST = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(GraphQLSubscriptionProtocol)
proto3.util.setEnumType(GraphQLSubscriptionProtocol, "wg.cosmo.common.GraphQLSubscriptionProtocol", [
  { no: 0, name: "GRAPHQL_SUBSCRIPTION_PROTOCOL_WS" },
  { no: 1, name: "GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE" },
  { no: 2, name: "GRAPHQL_SUBSCRIPTION_PROTOCOL_SSE_POST" },
]);


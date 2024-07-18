// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const awsuiVisualRefreshFlag = Symbol.for('awsui-visual-refresh-flag');
export const awsuiGlobalFlagsSymbol = Symbol.for('awsui-global-flags');

interface GlobalFlags {
  appLayoutWidget?: boolean;
  analyticsMetadata?: boolean;
}

export interface FlagsHolder {
  [awsuiVisualRefreshFlag]?: () => boolean;
  [awsuiGlobalFlagsSymbol]?: GlobalFlags;
}

export const getTopWindow = () => {
  return window.top as FlagsHolder | null;
};

export function getGlobal() {
  return (typeof window !== 'undefined' ? window : globalThis) as FlagsHolder | null;
}

function readFlag(holder: FlagsHolder | null, flagName: keyof GlobalFlags) {
  return holder?.[awsuiGlobalFlagsSymbol]?.[flagName];
}

export const getGlobalFlag = (flagName: keyof GlobalFlags): GlobalFlags[keyof GlobalFlags] | undefined => {
  try {
    const ownFlag = readFlag(getGlobal(), flagName);
    if (ownFlag !== undefined) {
      return ownFlag;
    }
    return readFlag(getTopWindow(), flagName);
  } catch (e) {
    return undefined;
  }
};

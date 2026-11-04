declare global {
 interface Window { __ZHENGTU_ASSETS__?:Record<string,string> }
}

/** The web build keeps ordinary URLs; the standalone build supplies local data. */
export function assetUrl(url:string):string {
 const embedded=typeof window==='undefined'?undefined:window.__ZHENGTU_ASSETS__;
 return embedded?.[url.split(/[?#]/,1)[0]]??url;
}

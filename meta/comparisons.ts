// TODO: add unit tests for this...
export function compareObjects(o: any, p: any, skipFunctions: boolean = true) {
  let i: number;
  const keysO: string[] = Object.keys(o).sort();
  const keysP: string[] = Object.keys(p).sort();

  // check number of keys
  if (keysO.length !== keysP.length)
    return false;

  // check key names
  if (keysO.join('') !== keysP.join(''))
    return false;

  for (i = 0; i < keysO.length; ++i) {
    const keyO = keysO[i];
    const keyP = keysP[i];

    if (keyO === undefined || keyP === undefined) return false;

    if (o[keyO] instanceof Array) {
      if (!(p[keyO] instanceof Array)) return false;
      if (p[keyO].sort().join('') !== o[keyO].sort().join('')) return false;
    }
    else if (o[keyO] instanceof Date) {
      if (!(p[keyO] instanceof Date))
        return false;
      if (('' + o[keyO]) !== ('' + p[keyO]))
        return false;
    }
    else if (o[keyO] instanceof Function) {
      if (skipFunctions) continue;
      else {
        if (!(p[keyO] instanceof Function)) return false
      };
    }
    else if (o[keyO] instanceof Object) {
      if (!(p[keyO] instanceof Object)) return false;
      if (o[keyO] === o) {
        if (p[keyO] !== p) return false;
      }
      else if (compareObjects(o[keyO], p[keyO]) === false) return false;
    }
    if (o[keyO] !== p[keyO]) return false;
  }
  return true;
}

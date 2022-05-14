/**
 * @fileoverview reversi engine with webworker.
 */

/*
 * ex.
 *  ww = new Worker('reversi_engine.js');
 *  ww.onmessage = function(e) {
 *    let hinto = e.data.hinto;
 *    let kyokumensu = e.data.kyokumensu;
 *    let duration = e.data.duration;
 *
 *    // some processing
 *  }
 *  function yourfunc() {
 *    ww.postMessage({cells:cells, teban:teban, depth:3});
 *  }
 */

// const SENTE = 1;
// const GOTE = -1;
const BLANK = 0;
const NUMCELL = 8;

function count(c)
{
  let sum = 0;
  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    sum += c[i];
  }
  return sum;
}

/**
 * コレ以上ひっくり返されない石の数を数える。
 * @param  Array c 盤の情報
 * @return Integer   石の数の差(黒＋、白－)
 */
function fixedstones(c)
{
  let i;
  let sum = 0;
  let total = 0;
  if (c[0] != BLANK) {
    let cnr = c[0];
    // right
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[i] != cnr)
        break;
    }
    sum = i;
    // down
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[i*NUMCELL] != cnr)
        break;
    }
    sum += i;
    // right down
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[i*NUMCELL+i] != cnr)
        break;
    }
    sum += i;
    total += cnr * sum;
  }
  if (c[NUMCELL-1] != BLANK) {
    let cnr = c[NUMCELL-1];
    // left
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[NUMCELL-1-i] != cnr)
        break;
    }
    sum = i;
    // down
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[i*NUMCELL + NUMCELL-1] != cnr)
        break;
    }
    sum += i;
    // left  down
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[i*NUMCELL + NUMCELL-1-i] != cnr)
        break;
    }
    sum += i;
    total += cnr * sum;
  }
  if (c[NUMCELL*NUMCELL-NUMCELL] != BLANK) {
    let cnr = c[NUMCELL*NUMCELL-NUMCELL];
    // right
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[NUMCELL*NUMCELL-NUMCELL+i] != cnr)
        break;
    }
    sum = i;
    // up
    for (i = 2 ; i < NUMCELL ; ++i) {
      if (c[NUMCELL*(NUMCELL-i)] != cnr)  // c[NUMCELL*(NUMCELL-1-i)]
        break;
    }
    sum += i-1;
    // right  up
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[(NUMCELL-1-i)*NUMCELL + i] != cnr)
        break;
    }
    sum += i;
    total += cnr * sum;
  }
  if (c[NUMCELL*NUMCELL-1] != BLANK) {
    let cnr = c[NUMCELL*NUMCELL-1];
    // left
    for (i = 2 ; i < NUMCELL ; ++i) {
      if (c[NUMCELL*NUMCELL-i] != cnr)  // c[NUMCELL*NUMCELL-1-i]
        break;
    }
    sum = i-1;
    // up
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[(NUMCELL-i)*NUMCELL-1] != cnr)
        break;
    }
    sum += i;
    // left  up
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[(NUMCELL-i)*NUMCELL-1-i] != cnr)
        break;
    }
    sum += i;
    total += cnr * sum;
  }

  return total;
}

var evaltbl = [
  20, -5, 5, 3, 3, 5, -5, 20,
  -5, -5, 1, 1, 1, 1, -5, -5,
  5,   1, 1, 1, 1, 1,  1,  5,
  3,   1, 1, 0, 0, 1,  1,  3,
  3,   1, 1, 0, 0, 1,  1,  3,
  5,   1, 1, 1, 1, 1,  1,  5,
  -5, -5, 1, 1, 1, 1, -5, -5,
  20, -5, 5, 3, 3, 5, -5, 20];

function evaluate(c)
{
  let sum = 0;
  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    sum += evaltbl[i]*c[i];
  }
  sum += fixedstones(c) * 10;
  return sum;
}

function reverse(c, xc, yc)
{
  let i, j = -1;
  let color = c[xc+yc*NUMCELL];
  let val;

  // 左
  for (i = xc ; i !== 0 ;) {
    --i;
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = j+1 ; i < xc ; ++i) {
      c[i+NUMCELL*yc] = color;
    }
  }

  // 右
  j = -1;
  for (i = xc+1 ; i < NUMCELL ; ++i) {
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = xc+1 ; i < j ; ++i) {
      c[i+NUMCELL*yc] = color;
    }
  }

  // 上
  j = -1;
  for (i = yc ; i !== 0 ;) {
    --i;
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = j+1 ; i < yc ; ++i) {
      c[xc+NUMCELL*i] = color;
    }
  }

  // 下
  j = -1;
  for (i = yc+1 ; i < NUMCELL ; ++i) {
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = i;// this cam a
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = yc+1 ; i < j ; ++i) {
      c[xc+NUMCELL*i] = color;
    }
  }

  // 左上
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc-i < 0 || yc-i < 0) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc-i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc-i+NUMCELL*(yc-i)] = color;
    }
  }

  // 右上
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc-i < 0) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc-i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc+i+NUMCELL*(yc-i)] = color;
    }
  }

  // 右下
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc+i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc+i+NUMCELL*(yc+i)] = color;
    }
  }

  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc-i < 0 || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc+i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[(xc-i)+NUMCELL*(yc+i)] = color;
    }
  }

  return c;
}

function genmove(c, tbn)
{
  let te = [];

  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    let val = c[i];
    if (val === BLANK) {
      let x, y;
      x = i%NUMCELL;
      y = (i-x)/NUMCELL;
      if (checkreverse(c, x, y, tbn)) {
        te.push({x: x, y: y, hyoka: null, child:null});
        // console.log("genmove %d,%d", x, y);
      }
    }
  }
  return te;
}

/** 読みと指手の生成 */
function genandeval(node, c, teban, depth)
{
  if (depth == 0) {
    node.kyokumensu = 1;
    node.child = null;
    return evaluate(c);
  }

  let child = genmove(c, teban);
  node.child = child;
  if (child.length == 0) {  // 指し手無し ≒ パス
    node.kyokumensu = 1;
    node.child = null;
    let val = count(c)*200;
//  console.log("pass @d%d ban:%d val:%d",depth,teban,val);
    node.hyoka = val;
    return node;
  }

  let celltmp = new Array(NUMCELL*NUMCELL);
  let sum  = 0;
  for (let i = 0 ; i < node.child.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    let val =  genandeval(child[i], celltmp, -teban, depth-1);
    if (depth == 1) {  // if (val.hyoka == null) {
      child[i].hyoka = val;
    } else {
      child[i].hyoka = val.hyoka;
      val = val.hyoka;
    }
    sum += child[i].kyokumensu;
// console.log("c%d:%d,%d:%d:%d",depth,x,y,teban,val);
// console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
//             node.hyoka*teban, val, teban, val*teban, depth);
// console.dir(node);
    if (node.best == null || node.hyoka*teban < val*teban) {
      node.best = node.child[i];
      node.hyoka = node.child[i].hyoka;  // node.hyoka = node.best.hyoka;
//  console.log("updated!")
    } else {
      // メモリ解放のつもり
      child[i] = null;
      node.child[i] = null;
    }
  }

  node.kyokumensu = sum;

  return node;
}

function shuffle(arr) {
  let i, j, temp;
  arr = arr.slice();
  i = arr.length;
  if (i === 0) {
    return arr;
  }
  while (--i) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/** 読みと指手の生成 */
function genandeval_shuffle(node, c, teban, depth)
{
  /* if (depth == 0) {
    node.kyokumensu = 1;
    node.child = null;
    return evaluate(c);
  }*/
// console.info('genandeval');
  let child = genmove(c, teban);
  if (child.length == 0) {  // 指し手無し ≒ パス
    node.child = child;
    node.kyokumensu = 1;
    let val = count(c)*100;
    return val;
  } else {
    // shuffle
    node.child = shuffle(child);
  }
  // let points = new Array(node.child.length);
  let celltmp = new Array(NUMCELL*NUMCELL);
  let sum  = 0;
  for (let i = 0 ; i < node.child.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    let val =  genandeval(child[i], celltmp, -teban, depth-1);
    if (depth == 1) {  // if (val.hyoka == null) {
      child[i].hyoka = val;
    } else {
      child[i].hyoka = val.hyoka;
      val = val.hyoka;
    }
    sum += child[i].kyokumensu;
//  console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
//              node.hyoka*teban, val, teban, val*teban, depth);
//  console.dir(node);
    if (node.best == null || node.hyoka*teban < val*teban) {
      node.best = node.child[i];
      node.hyoka = val;  // node.child[i].hyoka;  // node.best.hyoka;
// console.info("updated!%d,%d:%d:%d",
//              node.best.x, node.best.y, teban, node.hyoka);
// console.log("updated!")
    } else {
      // メモリ解放のつもり
      child[i] = null;
      node.child[i] = null;
// console.log("%d,%d:%d:%d", x, y, teban, val);
    }
    // points[i] = val;
  }

  node.kyokumensu = sum;

// console.log("best %d,%d:%d:%d", node.best.x, node.best.y, teban, node.hyoka);

  return node;
}

/** N手読み */
function hintNr(c, teban, n)
{
  let hinto = {x: -1, y: -1, hyoka: null, child:null, kyokumensu:0};
  hinto = genandeval_shuffle(hinto, c, teban, n);

  return [hinto.best, hinto.kyokumensu];
}

/**
 * [onmessage description]
 * @param  {Object} e {cells:, teban:, depth:}
 * @return {Object}   {hinto:, kyokumensu:, duration:}
 */
onmessage = function (e) {
  let teban = e.data.teban;
  let cells = e.data.cells;
  let depth = e.data.depth;

  let starttime = new Date().getTime();

  let [hinto, kyokumensu] = hintNr(cells, teban, depth);

  let finishtime = new Date().getTime();
  let duration = finishtime - starttime;

  this.postMessage({hinto:hinto, kyokumensu:kyokumensu, duration:duration});
};

function move(c, x, y, t)
{
  c[x+y*NUMCELL] = t;
  return reverse(c, x, y);
}

// var celltmp = new Array(NUMCELL*NUMCELL);

/**
 * @param c 盤の情報
 * @param xc チェックする座標
 * @param yc チェックする座標
 * @param color 石の色
 */
function checkreverse(c, xc, yc, color)
{
  let i, j = false;
  let rev = false;
  let val;

  // ←
  for (i = xc ; i !== 0 ;) {
    --i;
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →
  j = false;
  rev = false;
  for (i = xc+1 ; i < NUMCELL ; ++i) {
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ↑
  j = false;
  rev = false;
  for (i = yc ; i !== 0 ;) {
    --i;
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ↓
  j = false;
  rev = false;
  for (i = yc+1 ; i < NUMCELL ; ++i) {
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ←↑
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc < i || yc < i) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc-i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →↑
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc < i) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc-i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →↓
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc+i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ←↓
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc < i || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc+i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }
  return false;
}

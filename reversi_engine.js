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

const SENTE = 1;
const GOTE = -1;
const BLANK = 0;
const NUMCELL = 8;
const CELL2D = NUMCELL * NUMCELL;
const BM_SINGLE = 0;
const BM_TWINS = 1;

const ALPHA_INIT = -20000;
const BETA_INIT = 20000;

// var brothermode = BM_SINGLE;
var brothermode = BM_TWINS;
var oBrother = null;

var route = [];
function route_push(x, y)
{
  route.push(x + "" + y);
}
function route_pop(hyoka)
{
  // console.log(route.join(",") + ":" + hyoka);
  route.pop();
}

function count(c)
{
  let sum = 0;
  for (let i = 0 ; i < CELL2D ; ++i) {
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
  if (c[CELL2D-NUMCELL] != BLANK) {
    let cnr = c[CELL2D-NUMCELL];
    // right
    for (i = 1 ; i < NUMCELL-1 ; ++i) {
      if (c[CELL2D-NUMCELL+i] != cnr)
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
  if (c[CELL2D-1] != BLANK) {
    let cnr = c[CELL2D-1];
    // left
    for (i = 2 ; i < NUMCELL ; ++i) {
      if (c[CELL2D-i] != cnr)  // c[CELL2D-1-i]
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
  for (let i = 0 ; i < CELL2D ; ++i) {
    sum += evaltbl[i]*c[i];
  }
  sum += fixedstones(c) * 10;
//  console.info("leaf:%d", sum);
  return sum;
}

/*
 * input: NUMCELL * NUMCELL + 1(teban) + 1
 * hidden: 4 + 1
 * output: 1
 */
var evaltbl2 = new Float32Array(CELL2D * 4 + 4 + 4 + 4 + 1);

function init_ev2()
{
  let range = Math.sqrt(6) / Math.sqrt(CELL2D + 1 + 4 + 1);
  for (let i = 0; i < evaltbl2.length ; ++i) {
    evaltbl2[i] = Math.random() * 2 * range - range;
  }
}
init_ev2();

function evaluate2(c, teban) {
  let sum = evaltbl2.slice(-1)[0];
  let w2 = evaltbl2.slice(-5);
  for (let j = 0; j < 4; ++j) {
    let w1 = evaltbl2.slice(j * (CELL2D + 2));
    let wlast2 = w1.slice(-2);
    let sum1 = wlast2[0] * teban + wlast2[1];
    for (let i = 0; i < CELL2D; ++i) {
      sum1 += w1[i] * c[i];
    }
    sum += w2[j] / (1 + Math.exp(sum1));
  }
  // sum += fixedstones(c) * 10;
  //  console.info("leaf:%d", sum);
  return sum;
  // return 1 / (1 + Math.exp(sum));
}

function training(kyokumen, teban, bwin, eta)
{
  // foward
  var sum = evaltbl2.slice(-1)[0];
  var hid = [0, 0, 0, 0, 0];
  var hidsig = [0, 0, 0, 0, 0];
  let w2 = evaltbl2.slice(-5);
  for (let j = 0; j < 4; ++j) {
    let w1 = evaltbl2.slice(j * (CELL2D + 2));
    let wlast2 = w1.slice(-2);
    let sum1 = wlast2[0] * teban + wlast2[1];
    for (let i = 0; i < CELL2D; ++i) {
      sum1 += w1[i] * kyokumen[i];
    }
    hid[j] = sum1;
    hidsig[j] = 1 / (1 + Math.exp(sum1));
    sum += w2[j] * hidsig[j];
  }

  // back to hidden
  var diff = bwin == 1 ? sum - bwin : sum;
  // let diff = sum - bwin;
  for (let j = 0; j < 4; ++j) {
    evaltbl2[j + 4 * CELL2D + 8] -= hidsig[j] * diff * eta;
  }
  evaltbl2[4 + 4 * CELL2D + 8] -= diff * eta;

  var dhid = [0, 0, 0, 0, 0];
  for (let j = 0; j < 4; ++j) {
    let tmp = evaltbl2[j + 4 * CELL2D + 8] * diff;
    let sig = 1 / (1 + Math.exp(hid[j]));
    dhid[j] = tmp * sig * (1 - sig);
  }

  // back to input
  for (let j = 0; j < 4; ++j) {
    for (let i = 0; i < CELL2D; ++i) {
      evaltbl2[j * (2 + CELL2D) + i]
          -= dhid[j] * kyokumen[i] * eta;
    }
    evaltbl2[j * (2 + CELL2D) + CELL2D]
      -= dhid[j] * teban * eta;
    evaltbl2[j * (2 + CELL2D) + CELL2D + 1]
      -= dhid[j] * 1 * eta;
  }
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

/**
 * generate possible moves.
 * @param {Array} c cells.
 * @param {*} tbn teban.
 * @returns null when no blank cells.
 */
function genmove(c, tbn)
{
  let te = [];
  let nblank = 0;
  for (let i = 0 ; i < CELL2D ; ++i) {
    let val = c[i];
    if (val === BLANK) {
      ++nblank;

      let x = i % NUMCELL;
      let y = (i - x) / NUMCELL;
      if (checkreverse(c, x, y, tbn)) {
        te.push({x: x, y: y, hyoka: null, child:null, best: null});
        // console.log("genmove %d,%d", x, y);
      }
    }
  }
  if (nblank == 0) return null;
  return te;
}

function debugcells(c, teban)
{
  let cells = [];
  for (let j = 0 ; j < NUMCELL ; ++j) {
    let line = new Array(NUMCELL);
    for (let i = 0; i < NUMCELL; ++i) {
      if (c[i + j * NUMCELL] == SENTE) {
        line[i] = "●";
      } else if (c[i + j * NUMCELL] == GOTE) {
        line[i] = "◯";
      } else {
        line[i] = " ";
      }
    }
    cells.push(line);
  }
  if (teban == SENTE) {
    console.debug({ teban: '●' });
  } else if (teban == GOTE) {
    console.debug({ teban: '◯' });
  }
  console.table(cells);
}

/** 読みと指手の生成 */
function genandeval(node, c, teban, depth) {
  if (depth == 0) {
    node.kyokumensu = 1;
    node.child = null;
    return { hyoka: evaluate2(c, teban) };
    // return evaluate(c);
  }

  let child = genmove(c, teban);
  if (child == null) {  // no blank cells.
    route_push('f', 'f');
    node.kyokumensu = 1;
    node.child = null;
    node.hyoka = count(c) * 200;
    route_pop(node.hyoka);
    return node;
  }
  if (child.length == 0) {  // 指し手無し ≒ パス
    // debugcells(c, teban);
    child = { x: -1, y: -1, hyoka: null, child: null, best: null };
    route_push('p', 's');
    let val = genandeval(child, c, -teban, depth - 1);

    child.hyoka = val.hyoka;
    node.child = [child];
    node.best = node.child[0];
    node.hyoka = val.hyoka;
    node.kyokumensu = child.kyokumensu + 1;
    route_pop(val.hyoka);
    return node;
  }
  node.child = child;

  let celltmp = new Array(CELL2D);
  let sum = 0;
  for (let i = 0; i < node.child.length; ++i) {
    for (let j = 0; j < CELL2D; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);

    let val = genandeval(child[i], celltmp, -teban, depth - 1);
    child[i].hyoka = val.hyoka;

    route_pop(val.hyoka);
    sum += child[i].kyokumensu;
    // console.log("c%d:%d,%d:%d:%d",depth,x,y,teban,val);
    // console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
    //             node.hyoka*teban, val, teban, val*teban, depth);
    // console.dir(node);
    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //  "teban:%d, node.hyoka: %d, val:%d @depth:%d",
      //   teban, node.hyoka, val, depth);
      node.best = node.child[i];
      node.hyoka = val.hyoka;
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

/**
 * 読みと指手の生成
 *
 * @note genandeval_alphabeta(node, c, teban, depth, ALPHA_INIT, BETA_INIT)
 */
function genandeval_alphabeta(node, c, teban, depth, alpha, beta)
{
  if (depth == 0) {
    node.kyokumensu = 1;
    node.child = null;
    return {hyoka: evaluate2(c, teban)};
    // return evaluate(c);
  }

  let child = genmove(c, teban);
  if (child == null) {  // no blank cells.
    route_push('f', 'f');
    node.kyokumensu = 1;
    node.child = null;
    node.hyoka = count(c) * 200;
    route_pop(node.hyoka);
    return node;
  }
  if (child.length == 0) {  // 指し手無し ≒ パス
    // debugcells(c, teban);
    child = { x: -1, y: -1, hyoka: null, child: null, best: null };
    route_push('p', 's');
    let val = genandeval_alphabeta(child, c, -teban, depth - 1, -beta, -alpha);

    child.hyoka = val.hyoka;
    node.child = [child];
    node.best = node.child[0];
    node.hyoka = val.hyoka;
    node.kyokumensu = child.kyokumensu + 1;
    route_pop(val.hyoka);
    return node;
  }
  node.child = child;

  let celltmp = new Array(CELL2D);
  let sum  = 0;
  for (let i = 0 ; i < node.child.length ; ++i) {
    for (let j = 0 ; j < CELL2D ; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);

    let val = genandeval_alphabeta(
      child[i], celltmp, -teban, depth - 1, -beta, -alpha);
    child[i].hyoka = val.hyoka;

    route_pop(val.hyoka);
    sum += child[i].kyokumensu;
// console.log("c%d:%d,%d:%d:%d",depth,x,y,teban,val);
// console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
//             node.hyoka*teban, val, teban, val*teban, depth);
// console.dir(node);

    // update alpha
    if (alpha < val.hyoka) alpha = val.hyoka;

    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //  "teban:%d, node.hyoka: %d, val:%d @depth:%d",
      //   teban, node.hyoka, val, depth);
      node.best = node.child[i];
      node.hyoka = val.hyoka;
//  console.log("updated!")
    } else if (alpha >= beta) {  // cut
      // メモリ解放のつもり
      for (; i < node.child.length; ++i) {
        child[i] = null;
        node.child[i] = null;
      }
      break;
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

function sort_child(arr, c, teban)
{
  return sort_pos(arr);
  // return scout_child(arr, c, teban);
}

const POS_ORDER_TBL = [
  0, 3, 1, 2, 2, 1, 3, 0,
  3, 3, 4, 4, 4, 4, 3, 3,
  1, 4, 4, 4, 4, 4, 4, 1,
  2, 4, 4, 4, 4, 4, 4, 2,
  2, 4, 4, 4, 4, 4, 4, 2,
  1, 4, 4, 4, 4, 4, 4, 1,
  3, 3, 4, 4, 4, 4, 3, 3,
  0, 3, 1, 2, 2, 1, 3, 0,
];

function sort_pos(arr)
{
  arr.sort(function (a, b) {
    return POS_ORDER_TBL[a.x + a.y * 8] - POS_ORDER_TBL[b.x + b.y * 8]; });
  return arr;
}

function scout_child(arr, c, teban)
{
  if (arr.length <= 1) return arr;

  let values = new Array(arr.length);
  let celltmp = new Array(CELL2D);
  for (let i = 0; i < arr.length; ++i) {
    for (let j = 0; j < CELL2D; ++j) {
      celltmp[j] = c[j];
    }
    let x = arr[i].x;
    let y = arr[i].y;
    celltmp = move(celltmp, x, y, teban);
    values[i] = {val: evaluate2(celltmp, -teban), idx: i};
  }


  values.sort(
    teban == GOTE
      ? function(a, b) { return b.val - a.val; }
      : function(a, b) { return a.val - b.val; });

  let ret = Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    ret[i] = arr[values[i].idx];
  }
  return ret;
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
  if (child == null) {  // no blank cells.
    return null;
  }
  if (child.length == 0) {  // 指し手無し ≒ パス
    if (brothermode == BM_TWINS) {
      oBrother = null;
      // ask brother think about half of children.
      this.postMessage(
        {
          cmd: 'partial', child: [],
          cells: c, teban: teban, depth: depth
        });
    }
    child = { x: -1, y: -1, hyoka: null, child: null, best: null };
    route_push('p', 's');
    let val = genandeval(child, c, -teban, depth - 1);

    child.hyoka = val.hyoka;

    route_pop(val.hyoka);

    node.child = [child];
    node.best = node.child[0];
    node.hyoka = val.hyoka;
    node.kyokumensu = child.kyokumensu + 1;
    return node;
  }
  // shuffle
  child = shuffle(child);

  if (brothermode == BM_TWINS) {
    oBrother = null;
    // ask brother think about half of children.
    this.postMessage(
      {
        cmd: 'partial', child: child.slice(0, child.length / 2),
       cells: c, teban: teban, depth: depth
      });

    child = child.slice(child.length / 2);
  }
  node.child = child;

  // let points = new Array(node.child.length);
  let celltmp = new Array(CELL2D);
  let sum  = 0;
  for (let i = 0 ; i < node.child.length ; ++i) {
    for (let j = 0; j < CELL2D ; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);
    let val =  genandeval(child[i], celltmp, -teban, depth-1);
    child[i].hyoka = val.hyoka;
    sum += child[i].kyokumensu;

    route_pop(val.hyoka);
//  console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
//              node.hyoka*teban, val, teban, val*teban, depth);
//  console.dir(node);
    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //     "teban:%d, node.hyoka: %d, val:%d", teban, node.hyoka, val);
      node.best = node.child[i];
      node.hyoka = val.hyoka;  // node.child[i].hyoka;  // node.best.hyoka;
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

/** 読みと指手の生成 */
function genandeval_shuffle_ab(node, c, teban, depth) {
  /* if (depth == 0) {
    node.kyokumensu = 1;
    node.child = null;
    return evaluate(c);
  }*/
  // console.info('genandeval');
  let child = genmove(c, teban);
  if (child == null) {  // no blank cells.
    return null;
  }
  if (child.length == 0) {  // 指し手無し ≒ パス
    if (brothermode == BM_TWINS) {
      oBrother = null;
      // ask brother think about half of children.
      this.postMessage(
        {
          cmd: 'partial_ab', child: [],
          cells: c, teban: teban, depth: depth
        });
    }
    child = { x: -1, y: -1, hyoka: null, child: null, best: null };
    route_push('p', 's');
    let val = genandeval_alphabeta(
      child, c, -teban, depth - 1, ALPHA_INIT, BETA_INIT);

    child.hyoka = val.hyoka;

    route_pop(val.hyoka);

    node.child = [child];
    node.best = node.child[0];
    node.hyoka = val.hyoka;
    node.kyokumensu = child.kyokumensu + 1;
    return node;
  }
  // shuffle
  // child = shuffle(child);

  if (brothermode == BM_TWINS) {
    oBrother = null;
    // ask brother think about half of children.
    this.postMessage(
      {
        cmd: 'partial_ab', child: child.slice(0, child.length / 2),
        cells: c, teban: teban, depth: depth
      });

    child = child.slice(child.length / 2);
  }
  // sort
  child = sort_child(child, c, teban);
  node.child = child;

  // let points = new Array(node.child.length);
  let celltmp = new Array(CELL2D);
  let sum = 0;
  let alpha = ALPHA_INIT;
  for (let i = 0; i < node.child.length; ++i) {
    for (let j = 0; j < CELL2D; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);
    let val = genandeval_alphabeta(
      child[i], celltmp, -teban, depth - 1, alpha, BETA_INIT);
    child[i].hyoka = val.hyoka;
    sum += child[i].kyokumensu;

    route_pop(val.hyoka);
    if (alpha < val.hyoka) alpha = val.hyoka;
    //  console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
    //              node.hyoka*teban, val, teban, val*teban, depth);
    //  console.dir(node);
    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //     "teban:%d, node.hyoka: %d, val:%d", teban, node.hyoka, val);
      node.best = node.child[i];
      node.hyoka = val.hyoka;  // node.child[i].hyoka;  // node.best.hyoka;
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

/** 読みと指手の生成 */
function genandeval_partial(child, c, teban, depth) {
  let node = {
    x: -1, y: -1, hyoka: null, child: child, kyokumensu: 0, best: null
  };

  if (child.length == 0) {  // 指し手無し
    return node;
  }

  // let points = new Array(node.child.length);
  let celltmp = new Array(CELL2D);
  let sum = 0;
  for (let i = 0; i < child.length; ++i) {
    for (let j = 0; j < CELL2D; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);
    let val = genandeval(child[i], celltmp, -teban, depth - 1);
    child[i].hyoka = val.hyoka;
    sum += child[i].kyokumensu;

    route_pop(val.hyoka);
    //  console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
    //              node.hyoka*teban, val, teban, val*teban, depth);
    //  console.dir(node);
    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //     "teban:%d, node.hyoka: %d, val:%d", teban, node.hyoka, val);
      node.best = node.child[i];
      node.hyoka = val.hyoka;
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

/** 読みと指手の生成 */
function genandeval_partial_ab(child, c, teban, depth) {
  let node = {
    x: -1, y: -1, hyoka: null, child: child, kyokumensu: 0, best: null
  };

  if (child.length == 0) {  // 指し手無し
    return node;
  }
  // sort
  child = sort_child(child, c, teban);

  // let points = new Array(node.child.length);
  let celltmp = new Array(CELL2D);
  let sum = 0;
  let alpha = ALPHA_INIT;
  for (let i = 0; i < child.length; ++i) {
    for (let j = 0; j < CELL2D; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    celltmp = move(celltmp, x, y, teban);

    route_push(x, y);
    let val = genandeval_alphabeta(child[i], celltmp, -teban, depth - 1, alpha, BETA_INIT);
    child[i].hyoka = val.hyoka;
    sum += child[i].kyokumensu;

    route_pop(val.hyoka);
    if (alpha < val.hyoka) alpha = val.hyoka;
    //  console.log("node.hyoka*teban(%d) < val(%d)*teban(%d)(%d) @ d%d",
    //              node.hyoka*teban, val, teban, val*teban, depth);
    //  console.dir(node);
    if (node.best == null || node.hyoka * teban < val.hyoka * teban) {
      // if (node.best != null) console.log(
      //     "teban:%d, node.hyoka: %d, val:%d", teban, node.hyoka, val);
      node.best = node.child[i];
      node.hyoka = val.hyoka;
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
  let hinto = {x: -1, y: -1, hyoka: null, child:null, kyokumensu:0,best: null};
  hinto = genandeval_shuffle(hinto, c, teban, n);
  // console.log("best:%f, %d nodes.", hinto.hyoka, hinto.kyokumensu)
  return [hinto.best, hinto.kyokumensu, hinto.hyoka];
}

/** N手読み alpha beta */
function hintNr_ab(c, teban, n) {
  let hinto = { x: -1, y: -1, hyoka: null, child: null, kyokumensu: 0, best: null };
  hinto = genandeval_shuffle_ab(hinto, c, teban, n);
  // console.log("best:%f, %d nodes.", hinto.hyoka, hinto.kyokumensu)
  return [hinto.best, hinto.kyokumensu, hinto.hyoka];
}

var yBrother = {};
function waitoBrother()
{
  if (oBrother == null) {
    this.setTimeout(waitoBrother, 100);
    return;
  }

  mergeResult(yBrother);
}

/**
 * merge brothers' thought.
 * @param {*} ybr a brother's thought.
 */
function mergeResult(ybr)
{
  let yhyoka = ybr.hyoka;
  let ohyoka = oBrother.hyoka;
  let teban = oBrother.teban;
  oBrother.kyokumensu += ybr.kyokumensu;

  if (yhyoka != null && ohyoka * teban < yhyoka * teban) {
    oBrother.hinto = ybr.best;
    oBrother.hyoka = yhyoka;
  }
  let duration = new Date().getTime() - starttime;
  // console.debug({ odu: oBrother.duration, ndu: duration });
  oBrother.duration = duration;
  let x = oBrother.hinto.x;
  let y = oBrother.hinto.y;
  console.log("merged best:%f (%d, %d), %d nodes.", oBrother.hyoka, x, y, oBrother.kyokumensu)
  this.postMessage(oBrother);
}

var starttime;
/**
 * [onmessage description]
 * @param  {Object} e {cells:, teban:, depth:}
 * @return {Object}   {hinto:, kyokumensu:, duration:}
 */
onmessage = function (e) {
  let cmd = e.data.cmd;
  if (cmd == 'train') {
    let teban = e.data.teban;
    let cells = e.data.cells;
    let output = e.data.output;
    let eta = e.data.eta;
    training(cells, teban, output, eta);
    training(rotate180(cells), teban, output, eta);
    this.postMessage({ cmd: cmd });
    return;
  }
  if (cmd == 'move') {
    let teban = e.data.teban;
    let cells = e.data.cells;
    let depth = e.data.depth;

    starttime = new Date().getTime();

    let [hinto, kyokumensu, hyoka] = hintNr(cells, teban, depth);

    let finishtime = new Date().getTime();
    let duration = finishtime - starttime;

    oBrother = 
      {
        cmd: 'move', hinto: hinto, kyokumensu: kyokumensu,
        hyoka: hyoka, duration: duration, teban: teban
      }
    if (brothermode == BM_SINGLE) {
      this.postMessage(oBrother);
    } else {
    }
    return;
  }
  if (cmd == 'move_ab') {
    let teban = e.data.teban;
    let cells = e.data.cells;
    let depth = e.data.depth;

    starttime = new Date().getTime();

    let [hinto, kyokumensu, hyoka] = hintNr_ab(cells, teban, depth);

    let finishtime = new Date().getTime();
    let duration = finishtime - starttime;

    oBrother =
    {
      cmd: 'move_ab', hinto: hinto, kyokumensu: kyokumensu,
      hyoka: hyoka, duration: duration, teban: teban
    }
    if (brothermode == BM_SINGLE) {
      this.postMessage(oBrother);
    } else {
    }
    return;
  }
  if (cmd == 'evaltbl') {
    this.postMessage({ cmd: cmd, evaltbl: evaltbl2 });
    return;
  }
  /* think as brother */
  if (cmd == 'think') {
    let child = e.data.child;
    let depth = e.data.depth;
    let teban = e.data.teban;
    let cells = e.data.cells;
    // think
    // res = { x: -1, y: -1, hyoka: null, child: null, kyokumensu: 0, best: null };
    let res = genandeval_partial(child, cells, teban, depth);
    if (res == null) {
      res = {cmd: 'think', best: null, hyoka: null, kyokumensu: 0};
    } else {
      res.cmd = 'think';
    }
    this.postMessage(res);
    return;
  }
  /* think as brother */
  if (cmd == 'think_ab') {
    let child = e.data.child;
    let depth = e.data.depth;
    let teban = e.data.teban;
    let cells = e.data.cells;
    // think
    // res = { x: -1, y: -1, hyoka: null, child: null, kyokumensu: 0, best: null };
    let res = genandeval_partial_ab(child, cells, teban, depth);
    if (res == null) {
      res = { cmd: 'think_ab', best: null, hyoka: null, kyokumensu: 0 };
    } else {
      res.cmd = 'think_ab';
    }
    this.postMessage(res);
    return;
  }
  /* result from brother */
  if (cmd == 'partial') {
    if (oBrother == null) {
      yBrother = e.data;
      this.setTimeout(waitoBrother, 100);
      return;
    }
    // merge
    mergeResult(e.data);
    return;
  }
  /* result from brother */
  if (cmd == 'partial_ab') {
    if (oBrother == null) {
      yBrother = e.data;
      this.setTimeout(waitoBrother, 100);
      return;
    }
    // merge
    mergeResult(e.data);
    return;
  }
  if (cmd == 'newevaltbl') {
    let et = e.data.evaltbl;
    if (evaltbl2.length == et.length) {
      for (let i = 0 ; i < et.length ; ++i) {
        evaltbl2[i] = Number(et[i]);
      }
    }
    this.postMessage({ cmd: cmd });
    return;
  }
};

function move(c, x, y, t)
{
  c[x+y*NUMCELL] = t;
  return reverse(c, x, y);
}

// var celltmp = new Array(CELL2D);

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

function rotate180(cells)
{
  let res = Array(CELL2D);
  for (let i = 0; i < NUMCELL; ++i) {
    for (let j = 0; j < NUMCELL; ++j) {
      res[i * NUMCELL + j] =
          cells[(NUMCELL - 1 - j) * NUMCELL + NUMCELL - 1 - i];
    }
  }
  return res;
}

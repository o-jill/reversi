//
// this file should be beasutified!!
//
//

function Sleep(Tmsec) {
  var d1 = new Date().getTime();
  var d2 = new Date().getTime();
  while (d2 < d1+Tmsec) {  // wait T msec.
    d2 = new Date().getTime();
  }
  return;
}

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

var evaltbl = [
  10,-5,5,3,3,5,-5,10,
  -5,-5,1,1,1,1,-5,-5,
  5,1,1,1,1,1,1,5,
  3,1,1,0,0,1,1,3,
  3,1,1,0,0,1,1,3,
  5,1,1,1,1,1,1,5,
  -5,-5,1,1,1,1,-5,-5,
  10,-5,5,3,3,5,-5,10];

function evaluate(c)
{
  let sum = 0;
  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    sum += evaltbl[i]*c[i];
  }
  return sum;
}

function reverse(c, xc, yc)
{
  let i, j = -1;
  let color = c[xc+yc*NUMCELL];
  let val;

  // ��
  for (i = xc ; i !== 0 ;){
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

  // �E
  j = -1;
  for (i = xc+1 ; i < NUMCELL ; ++i){
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

  // ��
  j = -1;
  for (i = yc ; i !== 0 ;){
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

  // ��
  j = -1;
  for (i = yc+1 ; i < NUMCELL ; ++i){
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = i;
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

  // ����
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i){
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

  // �E��
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i){
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

  // �E��
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i){
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
  for (i = 1 ; i < NUMCELL ; ++i){
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
          te.push({x: x, y: y, hyoka: 9999, child:null});
      }
    }
  }
  return te;
}

/** �ǂ݂Ǝw��̐��� */
function genandeval(node, c, teban, depth)
{
  if (depth == 0) {
    node.kyokumensu = 1;
    return evaluate(c);
  }

  let child = genmove(c, teban);
  node.child = child;
  if (child.length == 0) {  // �w���薳�� �� �p�X
    node.kyokumensu = 1;
    let val = count(c)*100;
    return val;
  }

  let celltmp = new Array(NUMCELL*NUMCELL);
  let sum  = 0;
  for (let i = 0 ; i < node.child.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = c[j];
    }
    let x = child[i].x;
    let y = child[i].y;
    move(celltmp, x, y, teban);

    let val =  genandeval(child[i], c, -teban, depth-1);
    child[i].hyoka = val;
    if (node.best == null || node.best.hyoka*teban < val*teban) {
      node.best = node.child[i];
      node.hyoka = node.best.hyoka;
    }
    sum += child[i].kyokumensu;
  }

  node.kyokumensu = sum;

  return node;
}

/** N��ǂ� */
function hintNr(cells, teban, n)
{
  let hinto = {x: -1, y: -1, hyoka: 9999, child:null, kyokumensu:0};
  hinto = genandeval(hinto, cells, teban, n);

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
  reverse(c, x, y);
}

// var celltmp = new Array(NUMCELL*NUMCELL);

/**
 * @param c �Ղ̏��
 * @param xc �`�F�b�N������W
 * @param yc �`�F�b�N������W
 * @param color �΂̐F
 */
function checkreverse(c, xc, yc, color)
{
  let i, j = false;
  let rev = false;
  let val;

  // ��
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

  // ��
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

  // ��
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

  // ��
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

  // ����
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

  // ����
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

  // ����
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

  // ����
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i){
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

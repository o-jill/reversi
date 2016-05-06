//aaaa

const canvas = document.getElementById('mycanvas');
var ctx = canvas.getContext('2d');
const inp = document.getElementById('eval');
const hintt = document.getElementById('hintt');
const kifu = document.getElementById('kifu');

const cellsize = 50;
const offset = 5;
const SENTE = 1;
const GOTE = -1;
const BLANK = 0;
const NUMCELL = 8;


/* 1:黒,0:なし,-1:白*/
var cells = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,1,-1,0,0,0,
  0,0,0,-1,1,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0];

var teban = SENTE;
var autocommove = 0;
var atcomchk = document.getElementById('acmchk');
var tesuu = 1;
var kifustr = "";

function draw()
{
  ctx.fillStyle = "rgb(0, 200, 0)";
  ctx.fillRect(offset, offset, NUMCELL*cellsize, NUMCELL*cellsize);

  for (let x = 0 ; x <= NUMCELL ; ++x) {
    ctx.beginPath();
    ctx.moveTo(offset+x*cellsize, offset+0);
    ctx.lineTo(offset+x*cellsize, offset+NUMCELL*cellsize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offset+0, offset+x*cellsize);
    ctx.lineTo(offset+NUMCELL*cellsize, offset+x*cellsize);
    ctx.stroke();
  }

  for (let y = 0 ; y < NUMCELL ; ++y) {
    for (let x = 0 ; x < NUMCELL ; ++x) {
      if (cells[x+y*NUMCELL] == SENTE) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5, cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else if (cells[x+y*NUMCELL] == GOTE) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5, cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else {
      }
    }
  }
}

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

  // 左
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

  // 右
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

  // 上
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

  // 下
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

  // 左上
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

  // 右上
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

  // 右下
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


function strteban()
{
  if (teban == SENTE) {
    return "BLACK turn";
  } else if (teban == GOTE) {
    return "WHITE turn";
  } else {
    return "Finished";
  }
}

function move(c, x, y, t)
{
  c[x+y*NUMCELL] = t;
  reverse(c, x, y);
}

function movestr(c, x, y, tb, ts, kms)
{
  let cnt = count(c);
  let str = ts.toString(10) + "手目 " + (x+1).toString(10) + (y+1).toString(10);
  if (tb == SENTE) {
    str += "黒 ";
  } else if (tb == GOTE) {
    str += "白 ";
  } else {
    str += "終了";
  }
  str += cnt.toString(10);
  if (tb !== BLANK) {
    str += " ";
    if (kms != null && kms > 0)
      // str += kms.toString(10) + "局面";
      str += kms.toLocaleString() + "局面";
    else
      str += "1億3手";
  }
  str += "\n";

  return str;
}

function onClick(e)
{
  if(!e) e = window.event; // レガシー
  let rect = e.target.getBoundingClientRect();
  let mousex = e.clientX-rect.left;
  let mousey = e.clientY-rect.top;
  let x = mousex-offset;
  let y = mousey-offset;
  if (x < 0 || x >= cellsize*NUMCELL || y < 0 || y >= cellsize*NUMCELL) {
    // out of the bord
  } else {
    // inp.value = x.toString(10) + "," + y.toString(10);
    let cellx = x / cellsize;
    let celly = y / cellsize;
    cellx = parseInt(cellx.toString(10));
    celly = parseInt(celly.toString(10));
    // inp.value = cellx.toString(10) + "," + celly.toString(10);
    if (cells[cellx+celly*NUMCELL] == BLANK) {
      if (checkreverse(cells, cellx, celly, teban)) {
        move(cells, cellx, celly, teban);

        kifu.value += movestr(cells, cellx, celly, teban, tesuu, 0/*man*/);

        ++tesuu;
        // 手番変更
        if (teban == SENTE) {
          teban = GOTE;
        } else if (teban == GOTE) {
          if (tesuu > NUMCELL*NUMCELL-4) {
            teban = BLANK;
          } else {
            teban = SENTE;
          }
        }
      } else {
        let te = genmove(cells, teban);
        if (te.length === 0) {
          // パス→手番変更
          if (teban == SENTE) {
            teban = GOTE;
          } else if (teban == GOTE) {
            teban = SENTE;
          }
        }
      }
    }

    draw();
    //if (teban != BLANK && autocommmove !== 0)
    if (atcomchk.checked == true)
      COMmoveR();
  }
  // inp.value = evaluate(cells).toString(10) + "," + strteban();
}

var celltmp = new Array(NUMCELL*NUMCELL);


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

/** 1手読み */
function hint()
{
  let hinto = genmove(cells, teban);
  let str = hinto.length;
  for (let i = 0 ; i < hinto.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = cells[j];
    }
    let x = hinto[i].x;
    let y = hinto[i].y;
    celltmp[x+y*NUMCELL] = teban;
    reverse(celltmp, x, y, teban);
    let val = evaluate(celltmp);
    hinto[i].hyoka = val;
  }
  hinto.sort(function(a, b) {
    if (a.hyoka > b.hyoka)
      return -1;
    if (a.hyoka < b.hyoka)
      return 1;
    return 0;
  });
  for (let i = 0 ; i < hinto.length ; ++i) {
    let x = hinto[i].x;
    let y = hinto[i].y;
    let val = hinto[i].hyoka;
    str = str + "(" + x.toString(10) + "," + y.toString(10) + "," + val + "), ";
  }
  hintt.value = str;

  return hinto;
}


/** 2手読み */
function hint2()
{
  let hinto = genmove(cells, teban);
  let celltmp2 = new Array(NUMCELL*NUMCELL);
  for (let i = 0 ; i < hinto.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = cells[j];
    }
    let x = hinto[i].x;
    let y = hinto[i].y;
    move(celltmp, x, y, teban);

    hinto[i].child = genmove(celltmp, -teban);
    if (hinto[i].child.length === 0) {
      let val = evaluate(celltmp);
      hinto[i].hyoka = val;
      hinto[i].best = hinto[i];
    } else {
      for (let k = 0 ; k < hinto[i].child.length ; ++k) {
        for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
          celltmp2[j] = celltmp[j];
        }
        let x = hinto[i].child[k].x;
        let y = hinto[i].child[k].y;
        move(celltmp2, x, y, -teban);
        let val = evaluate(celltmp2);
        hinto[i].child[k].hyoka = val;
        if (hinto[i].best == null || hinto[i].best.hyoka < -val) {
          hinto[i].best = hinto[i].child[k];
        }
      }
    }
  }
  hinto.sort(function(a, b) {
    if (a.best.hyoka > b.best.hyoka)
      return -1;
    if (a.hyoka < b.hyoka)
      return 1;
    return 0;
  });

  return hinto;
}

/** 3手読み */
function hint3()
{
  let hinto = genmove(cells, teban);
  let celltmp2 = new Array(NUMCELL*NUMCELL);
  let celltmp3 = new Array(NUMCELL*NUMCELL);
  for (let i = 0 ; i < hinto.length ; ++i) {
    for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
      celltmp[j] = cells[j];
    }
    let x = hinto[i].x;
    let y = hinto[i].y;
    move(celltmp, x, y, teban);

    hinto[i].child = genmove(celltmp, -teban);
    if (hinto[i].child.length === 0) {
      let val = evaluate(celltmp);
      hinto[i].hyoka = val;
      hinto[i].best = hinto[i];
    } else {
      for (let k = 0 ; k < hinto[i].child.length ; ++k) {
        for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
          celltmp2[j] = celltmp[j];
        }
        let x = hinto[i].child[k].x;
        let y = hinto[i].child[k].y;
        move(celltmp2, x, y, -teban);

        hinto[i].child[k].child = genmove(celltmp2, teban);
        if (hinto[i].child[k].child.length === 0) {
          let val = evaluate(celltmp2);
          hinto[i].child[k].hyoka = val;
          hinto[i].child[k].best = hinto[i].child[k];
        } else {
          for (let l = 0 ; l < hinto[i].child[k].child.length ; ++l) {
            for (let j = 0 ; j < NUMCELL*NUMCELL ; ++j) {
              celltmp3[j] = celltmp2[j];
            }
            let x = hinto[i].child[k].child[l].x;
            let y = hinto[i].child[k].child[l].y;
            move(celltmp3, x, y, teban);

            let val = evaluate(celltmp3);
            hinto[i].child[k].child[l].hyoka = val;
            if (hinto[i].child[k].best == null || hinto[i].child[k].best.hyoka < val) {
              hinto[i].child[k].best = hinto[i].child[k].child[l];
            }
          }
        }
        if (hinto[i].best == null || hinto[i].best.hyoka < hinto[i].child[k].best.hyoka) {
          hinto[i].best = hinto[i].child[k];
        }
      }
    }
  }
  hinto.sort(function(a, b) {
    if (a.best.hyoka > b.best.hyoka)
      return -1;
    if (a.hyoka < b.hyoka)
      return 1;
    return 0;
  });

  return hinto;
}

/* 読みと指手の生成 */
function genandeval(node, c, teban, depth)
{
  if (depth == 0) {
    node.kyokumensu = 1;
    return evaluate(c);
  }

  let child = genmove(c, teban);
  node.child = child;
  if (child.length == 0) {
     let val = count(c)*100;
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

/** 3手読み */
function hint3r()
{
  let hinto = {x: -1, y: -1, hyoka: 9999, child:null, kyokumensu:0};
  hinto = genandeval(hinto, cells, teban, 3);

  return [hinto.best, 0];
}

/** N手読み */
function hintNr(n)
{
  let hinto = {x: -1, y: -1, hyoka: 9999, child:null, kyokumensu:0};
  hinto = genandeval(hinto, cells, teban, n);

  return [hinto.best, hinto.kyokumensu];
}


function checkResign()
{
    // よくわからんので延期
}

function COMmove()
{
  let hinto = hint3();

  if (hinto.length === 0)
    return;

  let x, y;
  if (teban == SENTE) {
    x = hinto[0].x;
    y = hinto[0].y;
  } else {
    x = hinto[hinto.length-1].x;
    y = hinto[hinto.length-1].y;
  }
  move(cells, x, y, teban);

  kifu.value += movestr(cells, x, y, teban, tesuu, 3);

  ++tesuu;
  // 手番変更
  if (teban == SENTE) {
    teban = GOTE;
  } else if (teban == GOTE) {
    if (tesuu >= NUMCELL*NUMCELL-4) {
      teban = BLANK;
    } else {
      teban = SENTE;
    }
  }
  draw();
}

function COMmoveR()
{
  let [hinto, kyokumensu] = hintNr(7);

//  if (hinto.length === 0)
//    return;

  let x, y;
  x = hinto.x;
  y = hinto.y;
  move(cells, x, y, teban);

  kifu.value += movestr(cells, x, y, teban, tesuu, kyokumensu);

  ++tesuu;
  // 手番変更
  if (teban == SENTE) {
    teban = GOTE;
  } else if (teban == GOTE) {
    if (tesuu >= NUMCELL*NUMCELL-4) {
      teban = BLANK;
    } else {
      teban = SENTE;
    }
  }
  draw();
}

function init()
{
  cells = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,1,-1,0,0,0,
  0,0,0,-1,1,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0];

  teban = SENTE;

  tesuu = 1;
  kifustr = "";

  kifu.value = "";
  inp.value = "";
  draw();
}

function AutoCOMMove()
{
  autocommove = 1-autocommove;
  inp.text = "" + autocommove;
}

function ___init()
{
    draw();
}

___init();

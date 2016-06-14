/**
 * @fileoverview reversi gui interfaces
 */

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


/* 1:��,0:�Ȃ�,-1:��*/
var cells = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, SENTE, GOTE, 0, 0, 0,
  0, 0, 0, GOTE, SENTE, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0];

var teban = SENTE;
var autocommove = 0;
var autocommatch = 0;
var atcomchk = document.getElementById('acmchk');
var atcommatchchk = document.getElementById('acmachk');
var tesuu = 1;
// var kifustr = "";
var pass = 0;

var enableclick = true;
var workerthread = new Worker('reversi_engine.js');
const prgs = document.getElementById('prgs');
const prgsm = document.getElementById('prgs2');


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
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5,
                cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else if (cells[x+y*NUMCELL] == GOTE) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5,
                cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else {
        // never come
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

function reverse(c, xc, yc)
{
  let i, j = -1;
  let color = c[xc+yc*NUMCELL];
  let val;

  // ��
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

  // �E
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

  // ��
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

  // ��
  j = -1;
  for (i = yc+1 ; i < NUMCELL ; ++i) {
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

  // �E��
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

  // �E��
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

function keiseibar(c)
{
  let cnt = count(c);
  prgs.value = cnt+64;
}

function movestr(c, x, y, tb, ts, kms, tm)
{
  let str = ts.toString(10) + "��� ";
  if (x < 0 || y < 0) {
    if (tb !== BLANK) {
      str += "�p�X";
    }
  } else {
    str += (x+1).toString(10) + (y+1).toString(10);
  }

  if (tb == SENTE) {
    str += " �� ";
  } else if (tb == GOTE) {
    str += " �� ";
  } else {
    str += " �I��";
  }

  let cnt = count(c);
  str += cnt.toString(10);

  if (tb !== BLANK) {
    str += " ";
    if (kms != null && kms > 0)
      // str += kms.toString(10) + "�ǖ�";
      str += kms.toLocaleString() + "�ǖ�";
    else
      str += "1��3��";
  }

  if (tm != null && tm >= 0) {
    str += " ";
    str += tm + "msec";
  }

  str += "\n";

  if (tb === BLANK) {
    if (cnt > 0) {
      str += "���̏���\n";
    } else if (cnt < 0) {
      str += "���̏���\n";
    } else {
      str += "��������\n";
    }
  }

  return str;
}

function onClick(e)
{
  if (!e) e = window.event; // ���K�V�[
  if (enableclick == false)
    return;
  let bnextmove = false;
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

        kifu.value += movestr(cells, cellx, celly, teban, tesuu, 0/* man */, 0);

        ++tesuu;
        pass = 0;
        bnextmove = true;

        // ��ԕύX
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
          // �p�X����ԕύX
          ++tesuu;
          ++pass;
          bnextmove = true;
          if (pass >= 2) {
            teban = BLANK;
          } else {
            if (teban == SENTE) {
              teban = GOTE;
            } else if (teban == GOTE) {
              teban = SENTE;
            }
          }
          kifu.value += movestr(cells, -1, -1, teban, tesuu, 0/* man */, 0);
        }
      }
    }

    if (bnextmove && teban == BLANK) {
      kifu.value += movestr(cells, -1, -1, teban, tesuu, 0, 0);
    }
    draw();
    keiseibar(cells);
    // if (teban != BLANK && autocommmove !== 0)
    if (bnextmove && atcomchk.checked == true)
      COMmoveR();
  }
  // inp.value = evaluate(cells).toString(10) + "," + strteban();
}


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

/**
 * generate possible moves.
 *
 * @param  {[Array]}   c   board situation
 * @param  {[Integer]} tbn SENTE or GOTE
 *
 * @return {[Array]}   Array of this --> {x: x, y: y, hyoka: 9999, child:null}
 */
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

function checkResign()
{
    // �悭�킩���̂ŉ���
}

function COMmove()
{
  if (enableclick == false)
    return;

  enableclick = false;
  // prgs.style.display = 'none';
  prgsm.style.display = 'block';

  workerthread.postMessage({cells:cells, teban:teban, depth:3});

  draw();
}

function COMmoveR()
{
  if (enableclick == false)
    return;

  enableclick = false;
  // prgs.style.display = 'none';
  prgsm.style.display = 'block';

  workerthread.postMessage({cells:cells, teban:teban, depth:7});

  draw();
}

function init()
{
  if (enableclick == false)
    return;

  cells = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, SENTE, GOTE, 0, 0, 0,
    0, 0, 0, GOTE, SENTE, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];

  teban = SENTE;

  tesuu = 1;
  // kifustr = "";
  pass = 0;

  kifu.value = "";
  inp.value = "";
  draw();
}

function AutoCOMMove()
{
  autocommove = 1-autocommove;
  inp.text = "" + autocommove;
}

function AutoCOMMatch()
{
  autocommatch = 1-autocommatch;
  inp.text = "" + autocommatch;
}

function hint()
{
  let te = genmove(cells, teban);
  let sz = te.length;
  let txt = "";
  for (let i = 0 ; i < sz ; ++i) {
    let x = te[i].x;
    let y = te[i].y;
    txt += "(" + x + "," + y + "),";
  }
  inp.value = txt;
}

workerthread.onmessage = function(e)
{
  let hinto = e.data.hinto;
  let kyokumensu = e.data.kyokumensu;
  let duration = e.data.duration;

  let x = -1, y = -1;
  if (hinto != null) {
    x = hinto.x;
    y = hinto.y;
  } else {
    // pass
  }

  if (x >= 0 && y >= 0) {
    move(cells, x, y, teban);
    pass = 0;
  } else {
    // pass
    ++pass;
  }

  kifu.value += movestr(cells, x, y, teban, tesuu, kyokumensu, duration);

  ++tesuu;
  // ��ԕύX
  if (pass >= 2) {
    teban = BLANK;
  } else {
    if (teban == SENTE) {
      teban = GOTE;
    } else if (teban == GOTE) {
      teban = SENTE;
    }
  }
  draw();
  keiseibar(cells);

  enableclick = true;
  // prgs.style.display = 'block';
  prgsm.style.display = 'none';

  if (atcommatchchk.checked == true && teban != BLANK) {
    COMmoveR();
  } else {
    if (teban == BLANK) {
      kifu.value += movestr(cells, -1, -1, teban, tesuu, 0, 0);
    }
  }
}

function ___init()
{
  draw();
}

___init();

import { useState, useEffect } from "react";
import { AergoClient, GrpcWebProvider, Contract } from "@herajs/client";
import {
  createIdentity,
  signTransaction,
  hashTransaction
} from "@herajs/crypto";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from "@material-ui/core/Checkbox";
import { makeStyles } from "@material-ui/core/styles";
import Loader from "react-loader-spinner";
import "./App.css";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex"
  },
  formControl: {
    margin: theme.spacing(3)
  }
}));

function App() {
  const classes = useStyles();
  const [aergo, setAergo] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [contract, setContract] = useState(null);
  const [result, setResult] = useState(null);
  const [select, setSelect] = useState([]);
  const [nonce, setNonce] = useState(1);
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dice, setDice] = useState({
    a: true,
    b: true,
    c: true,
    d: false,
    e: false,
    f: false
  });

  async function connect() {
    const client = new AergoClient(
      {},
      new GrpcWebProvider({ url: "http://alpha-api.aergo.io:7845" })
    );
    setAergo(client); // aergo 변수에 객체 할당
    console.log("connect done", client);
  }

  async function getAddress() {
    const identity = createIdentity();
    setIdentity(identity);
    console.log("ready identity", identity);
  }

  async function getSmartcontract() {
    const receipt = await aergo.getTransactionReceipt(
      "AnpepBt89BzVVBvzCkVNhbQPniyP71Bp8A2JvBThx1AF"
    );
    const conractAddress = receipt.contractaddress;

    const abi = await aergo.getABI(conractAddress);
    const sc = Contract.fromAbi(abi).setAddress(conractAddress);
    setContract(sc);
    console.log("ready contract", sc);
  }

  async function roll() {
    setResult(null);
    // 트랜잭션 만들기
    if (!identity || !contract) {
      // 계정이 없거나, 컨트랙트를 불러오지 못하면 여기가 호출됨.
      alert("게임 준비 해주세요!!");
      return;
    }
    setLoading(true);

    const chainIdHash = await aergo.getChainIdHash();
    const callTx = contract.roll(select).asTransaction({
      from: identity.address,
      nonce: nonce,
      chainIdHash: chainIdHash
    });

    callTx.sign = await signTransaction(callTx, identity.keyPair);
    callTx.hash = await hashTransaction(callTx, "bytes");

    aergo.sendSignedTransaction(callTx).then(tx => {
      setNonce(nonce + 1);
      setTx(tx);
      setTimeout(() => {
        aergo.getTransactionReceipt(tx).then(res => {
          console.log(res);
          setResult(res);
          setLoading(false);
        });
      }, 3000);
    });
  }

  const handleChange = event => {
    setDice({ ...dice, [event.target.name]: event.target.checked });
  };
  const { a, b, c, d, e, f } = dice;
  // const error =
  //   [a, b, c, d, e, f].filter(v => v).length < 1 ||
  //   [a, b, c, d, e, f].filter(v => v).length === 6;
  const error = select.length === 0 || select.length === 6;

  useEffect(() => {
    console.log("처음 한번만 실행됨");
    connect();
  }, []);

  useEffect(() => {
    if (aergo != null) {
      getSmartcontract();
      getAddress();
    }
  }, [aergo]);

  useEffect(() => {
    console.log("dice changed", dice);
    setSelect([]);
    // 어떠한 과정
    const temp = [];
    for (var i = 1; i < 7; i++) {
      // i: 1, 2, 3, 4, 5, 6
      if (Object.values(dice)[i - 1]) {
        temp.push(i);
      }
    }
    setSelect(temp);
  }, [dice]);

  useEffect(() => {
    console.log("select changed", select);
  }, [select]);

  // useEffect(() => {
  //   setSelect([]);
  //   const temp = [];
  //   for (var i = 0; i < 6; i++) {
  //     if (Object.values(dice)[i]) {
  //       temp.push(i + 1);
  //     }
  //   }
  //   setSelect(temp);
  // }, [dice]);

  return (
    <div className="App">
      <Paper className="section">
        <div className="title-area">
          <span className="title">게임 준비</span>
          {aergo ? <span>체인 연결됨</span> : <span>체인 준비 안됨</span>}
        </div>
        <div className="ready-area">
          {contract ? (
            <div>컨트랙트 로딩 완료</div>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => getSmartcontract()}
            >
              스마트컨트랙트 로딩
            </Button>
          )}
        </div>
        <div className="ready-area">
          {identity ? (
            <div>계정 생성 완료</div>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => getAddress()}
            >
              계정 생성
            </Button>
          )}
        </div>
      </Paper>
      <Paper className="section">
        <div className="title">주사위 선택</div>
        <div className="paper-area">
          <FormControl
            required
            error={error}
            component="fieldset"
            className={classes.formControl}
          >
            <FormLabel component="legend">주사위를 고르세요</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox checked={a} onChange={handleChange} name="a" />
                }
                label="1"
              />
              <FormControlLabel
                control={
                  <Checkbox checked={b} onChange={handleChange} name="b" />
                }
                label="2"
              />
              <FormControlLabel
                control={
                  <Checkbox checked={c} onChange={handleChange} name="c" />
                }
                label="3"
              />
              <FormControlLabel
                control={
                  <Checkbox checked={d} onChange={handleChange} name="d" />
                }
                label="4"
              />
              <FormControlLabel
                control={
                  <Checkbox checked={e} onChange={handleChange} name="e" />
                }
                label="5"
              />
              <FormControlLabel
                control={
                  <Checkbox checked={f} onChange={handleChange} name="f" />
                }
                label="6"
              />
            </FormGroup>
            {error ? (
              <FormHelperText>
                하나 이상의 주사위를 선택해주세요. 모두 고를 수는 없습니다.
              </FormHelperText>
            ) : (
              <></>
            )}
          </FormControl>
          {error ? (
            <></>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              disabled={loading}
              onClick={() => roll()}
            >
              주사위 던지기
            </Button>
          )}
        </div>
      </Paper>
      <Paper className="section">
        <div className="title">게임 결과</div>

        {loading ? (
          <div className="result-panel">
            <Loader
              type="ThreeDots"
              color="#00BFFF"
              height={100}
              width={100}
              timeout={100000} //3 secs
            />
          </div>
        ) : null}

        {result ? (
          <div className="paper-area">
            <div className="result">
              <span className="result-title">블록 해시</span>
              <span>{result.blockhash}</span>
            </div>
            <div className="result">
              <span className="result-title">블록 높이</span>
              <span>{result.blockno}</span>
            </div>
            <div className="result">
              <span className="result-title">트랜잭션 해시</span>
              <a href={`https://alpha.aergoscan.io/transaction/${tx}`}>{tx}</a>
            </div>
            <div className="result">
              <span className="result-title">결과</span>
              <span>{result.result}</span>
            </div>
          </div>
        ) : (
          <></>
        )}
      </Paper>
    </div>
  );
}

export default App;

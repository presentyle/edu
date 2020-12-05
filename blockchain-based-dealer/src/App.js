import "./App.css";
import { useState, useEffect } from "react";
import { AergoClient, GrpcWebProvider, Contract } from "@herajs/client";
import {
  createIdentity,
  signTransaction,
  hashTransaction
} from "@herajs/crypto";
import { makeStyles } from "@material-ui/core/styles";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from "@material-ui/core/Checkbox";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Loader from "react-loader-spinner";

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
  const [select, setSelect] = useState([]);
  const [dice, setDice] = useState({
    a: true,
    b: true,
    c: true,
    d: false,
    e: false,
    f: false
  });
  const [identity, setIdentity] = useState(null);
  const [aergo, setAergo] = useState(null);
  const [contract, setContract] = useState(null);
  const [nonce, setNonce] = useState(1);
  const [tx, setTx] = useState(null);
  const [result, setResult] = useState(null);
  const [preventGamble, setPreventGamble] = useState(false);

  async function connect() {
    const client = new AergoClient(
      {},
      new GrpcWebProvider({ url: "http://alpha-api.aergo.io:7845" })
    );
    setAergo(client);
  }

  async function getSmartcontract() {
    const receipt = await aergo.getTransactionReceipt(
      "Ab8T7tLSYb1aZLxUx9XWBYYLWcnj5ZM9xzEqqtb4zuip"
    );
    const contractAddress = receipt.contractaddress;

    const abi = await aergo.getABI(contractAddress);
    const sc = Contract.fromAbi(abi).setAddress(contractAddress);
    setContract(sc);

    console.log("ready contract");
  }

  async function getAddress() {
    const identity = createIdentity();
    setIdentity(identity);
    console.log("ready identity", identity);
  }

  async function doGamble() {
    setResult(null);
    // Build a transaction
    if (!identity || !contract) {
      alert("게임 준비를 마쳐주세요.");
      return;
    }
    setPreventGamble(true);

    const chainIdHash = await aergo.getChainIdHash();
    const callTx = contract.test(select).asTransaction({
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
        aergo.getTransactionReceipt(tx).then(result => {
          console.log(result);
          setResult(result);
          setPreventGamble(false);
        });
      }, 3000);
    });
  }

  useEffect(() => {
    connect();
  }, []);

  const handleChange = event => {
    setDice({ ...dice, [event.target.name]: event.target.checked });
  };

  const { a, b, c, d, e, f } = dice;
  const error =
    [a, b, c, d, e, f].filter(v => v).length < 1 ||
    [a, b, c, d, e, f].filter(v => v).length === 6;

  useEffect(() => {
    setSelect([]);
    const temp = [];
    for (var i = 0; i < 6; i++) {
      if (Object.values(dice)[i]) {
        temp.push(i + 1);
      }
    }
    setSelect(temp);
  }, [dice]);

  return (
    <div className="App">
      <Paper className="section">
        <div className="title">
          <span>게임 준비</span>
          {aergo ? <span>체인 연결됨</span> : <span>체인 연결 안됨</span>}{" "}
        </div>
        <div className="panel">
          {contract ? (
            <div>컨트랙트 로딩 완료</div>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => getSmartcontract()}
            >
              스마트컨트랙트 가져오기
            </Button>
          )}
        </div>
        <div className="panel">
          {identity ? (
            <div>
              <div>주소 생성 완료</div>
              <div id="address">{identity.address}</div>
            </div>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => getAddress()}
            >
              주소 생성
            </Button>
          )}
        </div>
      </Paper>
      <Paper className="section">
        <div className="title">주사위 선택</div>
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
            disabled={preventGamble}
            onClick={() => doGamble()}
          >
            주사위 던지기
          </Button>
        )}
      </Paper>
      <Paper className="section">
        <div className="title">게임 결과</div>
        <div className="panel">
          {preventGamble ? (
            <Loader type="Audio" color="#00BFFF" height={80} width={80} />
          ) : null}
          {result !== null ? (
            <div>
              <div>{result.result}</div>
              <Button
                variant="outlined"
                color="primary"
                href={`https://alpha.aergoscan.io/transaction/${tx}`}
              >
                결과 조회
              </Button>
            </div>
          ) : null}
        </div>
      </Paper>
    </div>
  );
}

export default App;

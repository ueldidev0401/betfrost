import React, { useState, useRef } from 'react';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';

import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import { Collapse } from 'react-collapse';
import Modal from 'react-modal';
import ReactPinField from "react-pin-field";

import {
    refreshAccount,
    sendTransactions,
    useGetAccountInfo,
    useGetNetworkConfig,
    useGetPendingTransactions,
} from '@elrondnetwork/dapp-core';
import {
    Address,
    AbiRegistry,
    SmartContractAbi,
    SmartContract,
    ProxyProvider,
    TypedValue,
    BytesValue,
    BigUIntValue,
    ArgSerializer,
    GasLimit,
    DefaultSmartContractController,
    OptionalValue,
    U32Value,
    AddressValue,
    Balance,
    TransactionPayload,
} from '@elrondnetwork/erdjs';

import './index.scss';
import buyTicketImg from 'assets/img/Grace of Freyja/Buy Ticket.svg';
import buyImg1 from 'assets/img/Grace of Freyja/buyImg1.png';
import buyImg2 from 'assets/img/Grace of Freyja/buyImg2.png';
import girl1Img from 'assets/img/Grace of Freyja/girl1.png';
import girl2Img from 'assets/img/Grace of Freyja/girl2.png';
import moneyImg from 'assets/img/Grace of Freyja/money.png';
import titleImg from 'assets/img/Grace of Freyja/title.svg';
import whowill from 'assets/img/Grace of Freyja/whowill.svg';
import winingCreteria from 'assets/img/Grace of Freyja/Wining Criteria.svg';
import winlost from 'assets/img/Grace of Freyja/winlost.svg';
import CountDown from './CountDown';

import {
    TIMEOUT,
    convertWeiToEsdt,
    getBalanceOfToken,
    convertEsdtToWei,
    IContractInteractor,
    convertTimestampToDateTime,
    getCurrentTimestamp,
    convertWeiToEgld,
    precisionfloor,
} from 'utils';
import {
    FREYJA_CONTRACT_ADDRESS,
    FREYJA_CONTRACT_ABI_URL,
    FREYJA_CONTRACT_NAME,
    FREYJA_DECIMALS_PRECISION,
} from 'config';
import {
    TOKENS
} from 'data';
import * as lotteryData from './lotteryData';

function parseTicketNumber(ticketNumber: number, number_of_brackets: number) {
    const digits = [];
    const s = String(ticketNumber).padStart(number_of_brackets, '0').split('').reverse().join('');
    for (let i = 0; i < number_of_brackets; i++) {
        digits.push(parseInt(s[i]));
    }
    return digits;
}

const usedIndexes = new Set();
function getUniqueRandomNumber(max) {
    const newNumber = Math.floor(Math.random() * max);
    if (usedIndexes.has(newNumber)) {
        return getUniqueRandomNumber(max);
    } else {
        usedIndexes.add(newNumber);
        return newNumber;
    }
}

const GraceOfFreyja = () => {
    //
    const { account, address } = useGetAccountInfo();
    const { network } = useGetNetworkConfig();
    const provider = new ProxyProvider(network.apiAddress, { timeout: TIMEOUT });
    const { hasPendingTransactions } = useGetPendingTransactions();

    // load smart contract abi and parse it to SmartContract object for tx
    const [contractInteractor, setContractInteractor] = React.useState<IContractInteractor | undefined>();
    React.useEffect(() => {
        async function loadContract() {
            const registry = await AbiRegistry.load({ urls: [FREYJA_CONTRACT_ABI_URL] });
            const abi = new SmartContractAbi(registry, [FREYJA_CONTRACT_NAME]);
            const contract = new SmartContract({ address: new Address(FREYJA_CONTRACT_ADDRESS), abi: abi });
            const controller = new DefaultSmartContractController(abi, provider);

            console.log(contract, controller);
            setContractInteractor({
                contract,
                controller,
            });
        }

        loadContract();
    }, []); // [] makes useEffect run once

    function parseLottery(value: any) {
        const lottery_id = value.lottery_id.toNumber();
        const status = value.status.name;
        const start_timestamp = new Date(value.start_timestamp.toNumber() * 1000);
        const end_timestamp = new Date(value.end_timestamp.toNumber() * 1000);
        const treasury_fee = value.treasury_fee.toNumber() / 100;

        const ticket_token_ids = value.ticket_token_ids.map(item => item.toString());
        const ticket_token_amounts = value.ticket_token_amounts.map(item => item.toString());

        const number_of_brackets = value.number_of_brackets.toNumber();
        const reward_percentage_per_bracket = value.reward_percentage_per_bracket.map(item => item.toNumber() / 100);
        const number_of_winners_per_bracket = value.number_of_winners_per_bracket.map(item => item.toNumber());

        const number_of_bought_tickets = value.number_of_bought_tickets.toNumber();

        let total_value_in_usd = 0;
        const collected_tokens = value.collected_tokens.map(item => {
            const token_identifier = item.token_identifier.toString();
            const token_ticker = token_identifier.split('-')[0];
            const amount = convertWeiToEsdt(item.amount.toNumber(), TOKENS[token_identifier].decimals, FREYJA_DECIMALS_PRECISION);
            const price_in_usd = precisionfloor(amount * TOKENS[token_identifier].unit_price_in_usd, FREYJA_DECIMALS_PRECISION);

            total_value_in_usd += price_in_usd;

            return {
                token_type: item.token_type.name,
                token_identifier: token_identifier,
                token_ticker: token_ticker,
                token_nonce: item.token_nonce.toNumber(),
                amount: amount,
                price_in_usd: price_in_usd,
            };
        });
        total_value_in_usd = precisionfloor(total_value_in_usd, FREYJA_DECIMALS_PRECISION);

        const brackets = reward_percentage_per_bracket.map((v: any) => {
            return {
                total_value_in_usd: precisionfloor(total_value_in_usd * v / 100, FREYJA_DECIMALS_PRECISION),
            };
        });

        const final_number = parseTicketNumber(value.final_number.toNumber(), number_of_brackets);
        const max_number_of_tickets_per_buy_or_claim = value.max_number_of_tickets_per_buy_or_claim.toNumber();

        return {
            lottery_id,
            status,
            start_timestamp,
            end_timestamp,
            treasury_fee,
            ticket_token_ids,
            ticket_token_amounts,
            number_of_brackets,
            reward_percentage_per_bracket,
            number_of_winners_per_bracket,
            number_of_bought_tickets,
            collected_tokens,
            final_number,
            max_number_of_tickets_per_buy_or_claim,

            total_value_in_usd,
            brackets,
        };
    }

    const [currentLottery, setCurrentLottery] = React.useState<any>();
    React.useEffect(() => {
        (async () => {
            if (!contractInteractor || hasPendingTransactions) return;
            const interaction = contractInteractor.contract.methods.viewCurrentLottery();
            const res = await contractInteractor.controller.query(interaction);

            if (!res || !res.returnCode.isSuccess()) return;
            const value = res.firstValue?.valueOf();
            console.log('currentLottery value', value);

            const currentLottery = parseLottery(value);

            // console.log(new Date().getTime(),"sfaskdfkweoiruowisjfdowieiorjerjoief");
            console.log('currentLottery', currentLottery);
            setCurrentLottery(currentLottery);
        })();
    }, [contractInteractor, hasPendingTransactions]);

    /** for finished rounds */
    const [selectedClaimableRoundIndex, setSelectedClaimableRoundIndex] = useState<number>(0); // for finished rounds
    const handlesetSelectedClaimableRoundIndex = (curID) => {
        if (!lotteries || lotteries.length == 0) return;
        if (curID >= 0 && curID < lotteries.length) {
            setSelectedClaimableRoundIndex(curID);
        }
    };

    const [lotteries, setLotteries] = React.useState<any>();
    React.useEffect(() => {
        (async () => {
            if (!contractInteractor || hasPendingTransactions) return;
            const interaction = contractInteractor.contract.methods.viewClaimableLotteries();
            const res = await contractInteractor.controller.query(interaction);

            if (!res || !res.returnCode.isSuccess()) return;
            const items = res.firstValue?.valueOf();

            const lotteries = [];
            for (let i = 0; i < items.length; i++) {
                const value = items[i];
                lotteries.push(parseLottery(value));
            }

            if (items.length > 0) {
                setSelectedClaimableRoundIndex(items.length - 1);
            }

            console.log('lotteries', lotteries);
            setLotteries(lotteries);
        })();
    }, [contractInteractor, hasPendingTransactions]);

    const [paymentTokens, setPaymentTokens] = useState<any>();
    React.useEffect(() => {
        if (!currentLottery) return;

        const tokens = [];
        for (let i = 0; i < currentLottery.ticket_token_ids.length; i++) {
            const token_id = currentLottery.ticket_token_ids[i];
            const amount = convertWeiToEsdt(currentLottery.ticket_token_amounts[i], TOKENS[token_id].decimals, FREYJA_DECIMALS_PRECISION);
            const ticket_price_in_usd = precisionfloor(amount * TOKENS[token_id].unit_price_in_usd, FREYJA_DECIMALS_PRECISION);
            tokens.push({
                ...TOKENS[token_id],
                amount: amount,
                ticket_price_in_usd: ticket_price_in_usd,
            });
        }

        console.log('paymentTokens', tokens);
        setPaymentTokens(tokens);
    }, [currentLottery]);

    /** for tab changes */
    const [tabValue, setTabValue] = useState('1');
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabValue(newValue);
    };

    /** for select tokens */
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
    const handleSelectTokenId = (token_id) => {
        setSelectedTokenIndex(token_id);
    };

    /** for select my lottery round */
    const [selectedMylotteryId, setSelectedMylotteryId] = useState<number>(0);
    const handleSelectMylotteryId = (lottery_id) => {
        setSelectedMylotteryId(lottery_id);
    };

    const [oldTickets, setOldTickets] = React.useState<any>();
    const [oldAccount, setOldAccount] = React.useState<any>();
    React.useEffect(() => {
        (async () => {
            if (!contractInteractor || !lotteries || !address) return;
            const lottery = lotteries[selectedMylotteryId];

            const args = [
                new AddressValue(new Address(address)),
                new U32Value(lottery.lottery_id),
            ];
            const interaction = contractInteractor.contract.methods.viewTickets(args);
            const res = await contractInteractor.controller.query(interaction);

            if (!res || !res.returnCode.isSuccess()) return;
            const items = res.firstValue?.valueOf();

            const number_of_win_brackets = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
            };
            let total_number_of_win_brackets = 0;
            let total_win_percentage = 0;

            const oldTickets = [];
            for (let i = 0; i < items.length; i++) {
                const value = items[i];

                const number = parseTicketNumber(value.number.toNumber(), lottery.number_of_brackets);
                const claimed = value.claimed;
                const win_bracket = value.win_bracket.toNumber();
                const win_percentage = value.win_percentage.toNumber() / 1000000;

                if (win_bracket > 0 && !claimed) {
                    number_of_win_brackets[win_bracket] += 1;
                    total_number_of_win_brackets += 1;
                    total_win_percentage += win_percentage;
                }

                const result = {
                    number,
                    claimed,
                    win_bracket,
                    win_percentage,
                };

                oldTickets.push(result);
            }

            console.log('oldTickets', oldTickets);
            setOldTickets(oldTickets);

            const total_value_in_usd = precisionfloor(lottery.total_value_in_usd * total_win_percentage / 100, FREYJA_DECIMALS_PRECISION);
            const oldAccount = {
                number_of_win_brackets,
                total_number_of_win_brackets,
                total_win_percentage,
                total_value_in_usd,
            };
            console.log(oldAccount);
            setOldAccount(oldAccount);
        })();
    }, [contractInteractor, address, lotteries, selectedMylotteryId]);

    const [newTickets, setNewTickets] = React.useState<any>([]);
    React.useEffect(() => {
        (async () => {
            if (!contractInteractor || !currentLottery || !address || hasPendingTransactions) return;

            const args = [
                new AddressValue(new Address(address)),
                new U32Value(currentLottery.lottery_id),
            ];
            const interaction = contractInteractor.contract.methods.viewTickets(args);
            const res = await contractInteractor.controller.query(interaction);

            if (!res || !res.returnCode.isSuccess()) return;
            const items = res.firstValue?.valueOf();

            const newTickets = [];
            for (let i = 0; i < items.length; i++) {
                const value = items[i];

                const number = parseTicketNumber(value.number.toNumber(), currentLottery.number_of_brackets);
                const claimed = value.claimed;
                const win_bracket = value.win_bracket.toNumber();
                const win_percentage = value.win_percentage.toNumber() / 1000000;

                const result = {
                    number,
                    claimed,
                    win_bracket,
                    win_percentage,
                };

                newTickets.push(result);
            }

            console.log("newTickets ===========", newTickets);
            setNewTickets(newTickets);
        })();
    }, [contractInteractor, address, currentLottery, hasPendingTransactions]);


    /** for number of tickets */
    const maxTicketCountPerOrder = 100;
    const maxTicketCountPerRound = 1000;

    const [ticketCount, setTicketCount] = useState<number | undefined>(0);
    const handleSetTicketCount = (ticketAmount) => {
        if (!address) {
            alert('Connect your wallet.');
            return;
        }
        if (!paymentTokens || !currentLottery) return;

        if (ticketAmount >= 0 && ticketAmount <= currentLottery.max_number_of_tickets_per_buy_or_claim) {
            if (balance >= ticketAmount * paymentTokens[selectedTokenIndex].amount) {
                setTicketCount(ticketAmount);
            } else {
                alert('Not enough balance.');
            }
        }
    };

    const handleMax = () => {
        setTicketCount(maxTicketCountPerOrder);
    };

    /** for buy ticket modal */
    const [showModal, setShowModal] = useState(false);
    const handleBuyTicket = () => {
        if (!address) {
            alert('Connect your wallet.');
            return;
        }

        if (!paymentTokens || !currentLottery) {
            alert('Loading is not finished.');
            return;
        }

        if (ticketCount <= 0) {
            alert('Invalid number of tickets.');
            return;
        } else if (ticketCount > currentLottery.max_number_of_tickets_per_buy_or_claim) {
            alert(`Cannot buy more than ${currentLottery.max_number_of_tickets_per_buy_or_claim} tickets.`);
            return;
        } else if (balance < ticketCount * paymentTokens[selectedTokenIndex].amount) {
            alert('Not enough balance.');
            return;
        } else if (currentLottery.status != 'Open') {
            alert('Round is closed.');
            return;
        } else {
            const TicketBin = [];
            for (let i = 0; i < ticketCount; i++) {
                TicketBin.push([]);
            }
            setCurrentOrderTickets(TicketBin);
            setShowModal(true);
        }
    };

    /** for generate tickets */
    const pinfieldsRef = useRef([]);
    const [CurrentOrderTickets, setCurrentOrderTickets] = useState<any>([]);

    const handleGenerateRandom = () => {
        const maxN = 9999;
        const len = pinfieldsRef.current.length;

        for (let i = 0; i < ticketCount; i++) {
            const ranN = getUniqueRandomNumber(maxN);

            pinfieldsRef.current[len - ticketCount + i].inputs[0].value = Math.floor(ranN / 1000);
            pinfieldsRef.current[len - ticketCount + i].inputs[1].value = Math.floor(ranN / 100 % 10);
            pinfieldsRef.current[len - ticketCount + i].inputs[2].value = Math.floor(ranN % 100 / 10);
            pinfieldsRef.current[len - ticketCount + i].inputs[3].value = Math.floor(ranN % 10);
        }
    };

    const handleModalOk = () => {
        (async () => {
            const numbers = [];
            const len = pinfieldsRef.current.length;
            for (let i = 0; i < ticketCount; i++) {
                let number = 0;
                number += parseInt(pinfieldsRef.current[len - ticketCount + i].inputs[0].value);
                number += parseInt(pinfieldsRef.current[len - ticketCount + i].inputs[1].value) * 10;
                number += parseInt(pinfieldsRef.current[len - ticketCount + i].inputs[2].value) * 100;
                number += parseInt(pinfieldsRef.current[len - ticketCount + i].inputs[3].value) * 1000;

                numbers.push(number);
            }
            console.log('numbers', numbers);

            if (paymentTokens[selectedTokenIndex].identifier == 'EGLD') {
                const args: TypedValue[] = [
                    new U32Value(currentLottery.lottery_id),	// lottery_id
                ];
                for (let i = 0; i < numbers.length; i++) {
                    args.push(new U32Value(numbers[i]));
                }

                const { argumentsString } = new ArgSerializer().valuesToString(args);
                const data = `buyTickets@${argumentsString}`;

                const tx = {
                    receiver: FREYJA_CONTRACT_ADDRESS,
                    data: data,
                    value: Balance.egld(paymentTokens[selectedTokenIndex].amount * numbers.length),
                    gasLimit: new GasLimit(6000000 + 3000000 * numbers.length),
                };

                await refreshAccount();
                await sendTransactions({ transactions: tx });
            } else {
                const args: TypedValue[] = [
                    BytesValue.fromUTF8(paymentTokens[selectedTokenIndex].identifier),
                    new BigUIntValue(convertEsdtToWei(paymentTokens[selectedTokenIndex].amount * numbers.length, paymentTokens[selectedTokenIndex].decimals)),
                    BytesValue.fromUTF8('buyTickets'),
                    new U32Value(currentLottery.lottery_id),	// lottery_id
                ];
                for (let i = 0; i < numbers.length; i++) {
                    args.push(new U32Value(numbers[i]));
                }

                const { argumentsString } = new ArgSerializer().valuesToString(args);
                const data = new TransactionPayload(`ESDTTransfer@${argumentsString}`);

                const tx = {
                    receiver: FREYJA_CONTRACT_ADDRESS,
                    data: data,
                    gasLimit: new GasLimit(6000000 + 3000000 * numbers.length),
                };

                await refreshAccount();
                await sendTransactions({ transactions: tx });
            }

            setShowModal(false);
        })();
    };

    function claimTickets() {
        if (!address) {
            alert('Connect your wallet.');
            return;
        }

        if (!paymentTokens || !currentLottery || !oldAccount) {
            alert('Loading is not finished.');
            return;
        }

        if (oldAccount.total_number_of_win_brackets == 0) {
            alert('There are no claimable ticket.');
            return;
        }

        (async () => {
            const args: TypedValue[] = [
                new U32Value(lotteries[selectedMylotteryId].lottery_id),	// lottery_id
            ];

            const { argumentsString } = new ArgSerializer().valuesToString(args);
            const data = `claimTickets@${argumentsString}`;

            const tx = {
                receiver: FREYJA_CONTRACT_ADDRESS,
                data: data,
                gasLimit: new GasLimit(6000000 + 3000000 * oldAccount.total_number_of_win_brackets),
            };

            await refreshAccount();
            await sendTransactions({ transactions: tx });
        })();
    }

    const handleModalCancel = () => {
        setCurrentOrderTickets([]);
        setShowModal(false);
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////
    const [balance, setBalance] = useState<number>(0);
    React.useEffect(() => {
        (async () => {
            if (!address || !paymentTokens || paymentTokens.length == 0 || hasPendingTransactions) return;

            const balance = await getBalanceOfToken(network.apiAddress, account, paymentTokens[selectedTokenIndex].identifier);
            setBalance(balance);
        })();
    }, [paymentTokens, selectedTokenIndex, hasPendingTransactions, address]);
    //////////////////////////////////////////////////////////////////////////////////////////////////

    const [isRoundDetailOpened, setCollapseOpen] = useState<boolean>(false);

    const [showBoughtTicketsModal, setShowBoughtTicketsModal] = useState(false);

    return (
        <>
            <div style={{ background: "#121212" }}>
                {/** first part : Lottery Home */}
                <div className='freyja-first-part'>
                    <Container className='freyja-inner-container text-center' style={{ paddingTop: "100px" }}>
                        <img className="freyja-title" src={titleImg} alt="Grace of Freyja" />

                        <CountDown targetTimestamp={currentLottery ? currentLottery.end_timestamp : getCurrentTimestamp() + 60000000} />
                        <p className="freyja-saying" style={{ filter: "drop-shadow(1px 2px 2px #000000)", fontSize:"29px" }}>
                            {
                                "Round" + (currentLottery?.end_timestamp.getTime() > new Date().getTime() ? currentLottery?.lottery_id + " is Live" : currentLottery?.lottery_id + " is Finished")
                            }
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
                            <a href="#buyTickets">
                                <div className="buy-ticket-button" >
                                    <img className="but-title" src={buyTicketImg} />
                                </div>
                            </a>
                        </div>

                        <div className='freyja-center mt-5'>
                            <div className="prize-pool-box">
                                <span style={{ fontSize: "20px", color: "white" }}>PRIZE POOL</span>
                                <span className='mt-1' style={{ fontFamily: "Segoe UI", fontWeight: "600", fontSize: "24px" }}>Total: ${currentLottery ? currentLottery.total_value_in_usd : '-'}</span>
                                {
                                    currentLottery && currentLottery.collected_tokens.map((collected_token, index) => (<span className='mt-2' key={`home-prize-pool-${index}`} style={{ fontFamily: "Segoe UI", fontWeight: "600", fontSize: "16px" }}>{collected_token.amount}{' '}{collected_token.token_ticker}</span>))
                                }
                                <span className='mb-3'></span>
                            </div>
                        </div>
                    </Container>
                </div>

                {/** second part : Control Lottery */}
                <div className='freyja-second-part' id="buyTickets">
                    <Container style={{ paddingTop: "20px" }}>
                        <p className='freyja-saying'>{"Our goddess Freyja is calling us ..."}</p>
                        <Box sx={{ width: '100%', typography: 'body1' }}>
                            <TabContext value={tabValue}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                                        <Tab label="Current" value="1" />
                                        <Tab label="Claim" value="2" />
                                    </TabList>
                                </Box>

                                {/** tab for current lottery */}
                                <TabPanel value="1">
                                    <div className="text-center">
                                        <span className="freyja-saying">{"Round " + (lotteries?.length + 1)}</span>
                                    </div>
                                    <Row>
                                        <Col md="5" style={{ marginTop: "10px" }}>
                                            <div className="Buy-Ticket-Box" >
                                                <span style={{ fontSize: "12px", color: "gray" }}>Payment Token</span>
                                                <Dropdown onSelect={handleSelectTokenId} drop='down'>
                                                    <Dropdown.Toggle className='token-id-toggle' id="token-id">
                                                        {
                                                            <>
                                                                <span>{paymentTokens && paymentTokens[selectedTokenIndex].ticker}</span>
                                                                <img src={paymentTokens && paymentTokens[selectedTokenIndex].url} />
                                                            </>
                                                        }
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className='token-id-menu'>
                                                        {
                                                            paymentTokens && paymentTokens.map((token, index) => (
                                                                <Dropdown.Item eventKey={index} key={`token-id-menu-item-${token.identifier}`}>
                                                                    <span>{token.ticker}</span>
                                                                    <img src={token.url} />
                                                                </Dropdown.Item>
                                                            ))
                                                        }
                                                    </Dropdown.Menu>
                                                </Dropdown>

                                                <span style={{ fontSize: "12px", color: "gray" }}>Number of Tickets</span>
                                                <div className="d-flex" >
                                                    <input className="custom-input" type='number' value={ticketCount ? ticketCount : ''} onChange={(e) => handleSetTicketCount(Number(e.target.value))} />

                                                    <div className="max-but ml-2" onClick={handleMax}>Max</div>
                                                </div>



                                                <div className="freyja-center">
                                                    <div style={{ justifyContent: "space-between", display: "flex", width: "100px" }}>
                                                        <div className="control-but" onClick={() => handleSetTicketCount(ticketCount - 1)}>-</div>
                                                        <div className="control-but" onClick={() => handleSetTicketCount(ticketCount + 1)}>+</div>
                                                    </div>

                                                </div>

                                                <div>
                                                    <div style={{ color: "rgba(165, 165, 165, 1)", fontSize: "12x" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span>Balance:</span>
                                                            <span>
                                                                {address && paymentTokens ? balance : '-'}
                                                                {' '}
                                                                {address && paymentTokens && paymentTokens[selectedTokenIndex].ticker}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span>Ticket Price:</span>
                                                            <span>
                                                                {paymentTokens ? paymentTokens[selectedTokenIndex].amount : '-'}
                                                                {' '}
                                                                {paymentTokens && paymentTokens[selectedTokenIndex].ticker}
                                                                {' ($'}
                                                                {paymentTokens ? paymentTokens[selectedTokenIndex].ticket_price_in_usd : '-'}
                                                                {')'}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span>Total Cost:</span>
                                                            <span>
                                                                {paymentTokens ? paymentTokens[selectedTokenIndex].amount * ticketCount : '-'}
                                                                {' '}
                                                                {paymentTokens && paymentTokens[selectedTokenIndex].ticker}
                                                                {' ($'}
                                                                {paymentTokens ? precisionfloor(paymentTokens[selectedTokenIndex].ticket_price_in_usd * ticketCount) : '-'}
                                                                {')'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="buy-tickets-but" onClick={handleBuyTicket}>
                                                    <img src={buyImg1} style={{ width: "20%" }} />
                                                    <span className="ml-3"> Buy Tickets </span>
                                                    <img src={buyImg2} className="ml-3" style={{ width: "20%" }} />
                                                </div>

                                                <div className="text-center mt-2 show-tickets" onClick={() => setShowBoughtTicketsModal(true)}>
                                                    {"You bought " + newTickets.length + " tickets. Click to look."}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md="7" style={{ marginTop: "10px" }}>
                                            <Row>
                                                <Col sm='7'>
                                                    <div className="Comment-Box">
                                                        <p className="Next-Draw">Next Draw is on &nbsp;<span style={{ color: "#EEC98A" }}>{currentLottery ? convertTimestampToDateTime(currentLottery.end_timestamp) : '-'}</span></p>
                                                        <p className="Comment">She is waiting for your prayers, buy tickets with caution. Good luck</p>

                                                        <Row>
                                                            <Col xs='6'>
                                                                <span className="Next-Draw"># Prize Pool</span>
                                                                <div className="d-flex" style={{ flexDirection: "column", color: "white" }}>

                                                                    <span className='mt-2' style={{ color: "#EEC98A" }}>Total: {'$'}{currentLottery ? currentLottery.total_value_in_usd : '-'}</span>

                                                                    {
                                                                        currentLottery && currentLottery.collected_tokens.map((collected_token, index) => (<span className='mt-2 Comment' key={`second-prize-pool-${index}`}>{collected_token.amount}{' '}{collected_token.token_ticker}</span>))
                                                                    }
                                                                    <span className='mb-3'></span>
                                                                </div>
                                                            </Col>
                                                            <Col xs='6' className="d-flex align-items-center">
                                                                <img className="w-100" src={moneyImg} alt="coin money" />
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </Col>
                                                <Col sm="5" className="justify-content-center d-flex">
                                                    <img className="girl1" src={girl1Img} />
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <div className="freyja-rounds freyja-center">
                                        <div style={{ color: "white" }}>
                                            <p style={{ fontFamily: "IM FELL English SC", fontSize: "18px" }}>Draw: {lotteries ? convertTimestampToDateTime(lotteries[selectedClaimableRoundIndex].end_timestamp) : '-'} </p>

                                            <div className="freyja-center" style={{ display: "flex", gap: "20px" }}>
                                                {
                                                    lotteries && lotteries[selectedClaimableRoundIndex].final_number.map((roundResult, index) => {
                                                        return (
                                                            <div className="lottery-small-number-card" key={index}>
                                                                <span className="lottery-number">{roundResult}</span>
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>

                                            <div className="freyja-center" style={{ display: "flex", gap: "20px", marginTop: "20px", marginBottom: "30px" }}>
                                                <div className="circle-but" onClick={() => handlesetSelectedClaimableRoundIndex(0)}>
                                                    <span>{"<<"}</span>
                                                </div>
                                                <div className="circle-but" onClick={() => handlesetSelectedClaimableRoundIndex(selectedClaimableRoundIndex - 1)}>
                                                    <span>{"<"}</span>
                                                </div>
                                                <div className="circle-but" onClick={() => handlesetSelectedClaimableRoundIndex(selectedClaimableRoundIndex + 1)}>
                                                    <span>{">"}</span>
                                                </div>
                                                <div className="circle-but" onClick={() => lotteries && handlesetSelectedClaimableRoundIndex(lotteries.length - 1)}>
                                                    <span>{">>"}</span>
                                                </div>
                                            </div>

                                            <p style={{ fontFamily: "IM FELL English SC", fontSize: "18px", color: "#BDBDBD", marginBottom: "30px" }}>
                                                Finished Round: #{lotteries ? lotteries[selectedClaimableRoundIndex].lottery_id : '-'}
                                                {/* <span className="details ml-3" onClick={() => setCollapseOpen(!isRoundDetailOpened)}>{!isRoundDetailOpened ? "DETAILS" : "HIDE"}</span> */}
                                            </p>

                                            <Collapse isOpened={true} style={{ marginTop: "-20px" }}>
                                                <div className='Collapse-Box mb-4' >
                                                    <span style={{ fontSize: "12px", color: "#bdbdbd" }}>{"Match the winning number in the same order to share prizes. Current prizes up for grabs:"}</span>

                                                    <Row className="d-flex justify-content-center">
                                                        <Col className="mt-3" xs="6" sm="3">
                                                            <div className="d-flex flex-column">
                                                                <span style={{ fontSize: "16px", fontWeight: "600" }}> Match first 1 </span>
                                                                {/* <span className="mt-2"> 405 Odin </span> */}
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#F1DA8A" }}> ~ ${lotteries ? lotteries[selectedClaimableRoundIndex].brackets[0].total_value_in_usd : '-'}</span>
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#fff" }}> {lotteries && `${lotteries[selectedClaimableRoundIndex].number_of_winners_per_bracket[0]} Win Tickets`}</span>
                                                            </div>
                                                        </Col>
                                                        <Col className="mt-3" xs="6" sm="3">
                                                            <div className="d-flex flex-column">
                                                                <span style={{ fontSize: "16px", fontWeight: "600" }}> Match first 2 </span>
                                                                {/* <span className="mt-2"> 405 Odin </span> */}
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#F1DA8A" }}> ~ ${lotteries ? lotteries[selectedClaimableRoundIndex].brackets[1].total_value_in_usd : '-'}</span>
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#fff" }}> {lotteries && `${lotteries[selectedClaimableRoundIndex].number_of_winners_per_bracket[1]} Win Tickets`}</span>
                                                            </div>
                                                        </Col>
                                                        <Col className="mt-3" xs="6" sm="3">
                                                            <div className="d-flex flex-column">
                                                                <span style={{ fontSize: "16px", fontWeight: "600" }}> Match first 3 </span>
                                                                {/* <span className="mt-2"> 405 Odin </span> */}
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#F1DA8A" }}> ~ ${lotteries ? lotteries[selectedClaimableRoundIndex].brackets[2].total_value_in_usd : '-'}</span>
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#fff" }}> {lotteries && `${lotteries[selectedClaimableRoundIndex].number_of_winners_per_bracket[2]} Win Tickets`}</span>
                                                            </div>
                                                        </Col>
                                                        <Col className="mt-3" xs="6" sm="3">
                                                            <div className="d-flex flex-column">
                                                                <span style={{ fontSize: "16px", fontWeight: "600" }}> Match first 4 </span>
                                                                {/* <span className="mt-2"> 405 Odin </span> */}
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#F1DA8A" }}> ~ ${lotteries ? lotteries[selectedClaimableRoundIndex].brackets[3].total_value_in_usd : '-'}</span>
                                                                <span className="mt-1" style={{ fontSize: "12px", color: "#fff" }}> {lotteries && `${lotteries[selectedClaimableRoundIndex].number_of_winners_per_bracket[3]} Win Tickets`}</span>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Collapse>

                                            <img src={whowill} style={{ width: "100%" }} alt="who will recieve the grace of freyja" />
                                        </div>
                                    </div>

                                </TabPanel>

                                {/** tab for lottery histories */}
                                <TabPanel value="2">

                                    <Row>
                                        <Col className="mt-2" lg="6">
                                            <Row>
                                                <Col sm="5" className="d-flex justify-content-center">
                                                    <img className="girl2" src={girl2Img} />
                                                </Col>
                                                <Col sm="7">
                                                    <div className="Comment-Box text-center">
                                                        <p className="Next-Draw"><span style={{ color: "#EEC98A" }}>Welcome!</span></p>
                                                        <p className="Comment">Choose date for grace of freyja.</p>
                                                    </div>

                                                    <div className="mt-2">
                                                        <Dropdown onSelect={handleSelectMylotteryId} drop='down'>
                                                            <Dropdown.Toggle className='token-id-toggle' id="token-id">
                                                                {
                                                                    lotteries ?
                                                                        (<>
                                                                            <span>#{lotteries[selectedMylotteryId].lottery_id}</span>
                                                                            <span>{convertTimestampToDateTime(lotteries[selectedMylotteryId].end_timestamp)}</span>
                                                                        </>) : '-'
                                                                }
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu className='token-id-menu'>
                                                                {
                                                                    lotteries && lotteries.map((myLottery, index) => (
                                                                        <Dropdown.Item eventKey={index} key={`MyLottery-id-menu-item-${index}`}>
                                                                            <span>#{myLottery.lottery_id}</span>
                                                                            <span>{convertTimestampToDateTime(myLottery.end_timestamp)}</span>
                                                                        </Dropdown.Item>
                                                                    ))
                                                                }
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </div>

                                                    <div className='mt-2'>
                                                        <div className="Comment-Box" style={{ background: "rgba(18,18,18,0.3)" }}>
                                                            <div className="freyja-center" style={{ display: "flex", gap: "20px" }}>
                                                                {
                                                                    lotteries && lotteries[selectedMylotteryId].final_number.map((roundResult, index) => {
                                                                        return (
                                                                            <div className="lottery-small-number-card" key={index}>
                                                                                <span className="lottery-number" style={{ fontFamily: "Arial", fontSize: "23px" }}>{roundResult}</span>
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                            </div>
                                                            <div className="mt-4" style={{ color: 'white' }}>
                                                                <div>Match First 1: {oldAccount ? oldAccount.number_of_win_brackets[1] : '-'}</div>
                                                                <div>Match First 2: {oldAccount ? oldAccount.number_of_win_brackets[2] : '-'}</div>
                                                                <div>Match First 3: {oldAccount ? oldAccount.number_of_win_brackets[3] : '-'}</div>
                                                                <div>Match First 4: {oldAccount ? oldAccount.number_of_win_brackets[4] : '-'}</div>
                                                                <div className="mt-2" style={{ color: "#F1DA8A" }}>Total Reward: {oldAccount ? `$${oldAccount.total_value_in_usd}` : '-'}</div>
                                                            </div>
                                                            <div className="freyja-center mt-5">
                                                                <div className="claim-but" onClick={claimTickets}>
                                                                    Claim Rewards
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Col>

                                        <Col className="mt-2" lg="6">
                                            <div className="Comment-Box p-0" style={{ background: "rgba(18,18,18,0.3)" }}>
                                                <div className='text-center pl-5 pr-5 pt-5'>
                                                    <img src={winlost} alt="win lost" style={{ width: "90%" }} />
                                                </div>
                                                <div className="custom-scroll-bar pl-5 pr-5" style={{ overflowY: "auto", height: "520px" }}>
                                                    <Row>
                                                        {
                                                            oldTickets && oldTickets.map((ticket, index) => {
                                                                const flag = ticket.win_bracket > 0 ? "win" : "lost";

                                                                return (
                                                                    <Col className="mt-4" sm="6" key={index}>
                                                                        {ticket.win_bracket > 0 ? (
                                                                            <Badge color={ticket.claimed ? "primary" : "secondary"} badgeContent={ticket.claimed ? "Claimed" : "Claimable"} >
                                                                                <div className={`ticket-box-${flag}`}>
                                                                                    <div className="ticket-medal">
                                                                                        <div className="ticket-medal-inner-box" >
                                                                                            <span>{ticket.win_bracket}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-center ml-3" >
                                                                                        <span className="ml-2">{ticket.number[0]}</span>
                                                                                        <span className="ml-2">{ticket.number[1]}</span>
                                                                                        <span className="ml-2">{ticket.number[2]}</span>
                                                                                        <span className="ml-2">{ticket.number[3]}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </Badge>
                                                                        ) : (
                                                                            <div className={`ticket-box-${flag}`}>
                                                                                <div className="ticket-medal">
                                                                                    <div className="ticket-medal-inner-box" >
                                                                                        <span>{ticket.win_bracket}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-center ml-3" >
                                                                                    <span className="ml-2">{ticket.number[0]}</span>
                                                                                    <span className="ml-2">{ticket.number[1]}</span>
                                                                                    <span className="ml-2">{ticket.number[2]}</span>
                                                                                    <span className="ml-2">{ticket.number[3]}</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Col>
                                                                );
                                                            })
                                                        }
                                                    </Row>
                                                </div>

                                            </div>
                                        </Col>
                                    </Row>
                                </TabPanel>
                            </TabContext>
                        </Box>
                    </Container>
                </div>

                {/** Third Part : How to play */}
                <div className='freyja-third-part pb-5'>
                    <Container style={{ paddingTop: "60px" }}>
                        <div className="text-center">
                            <p style={{ color: "#616161" }}>{"If the digits on your tickets match the winning numbers in the correct order, you win a portion of the prize pool."}</p>
                        </div>

                        <div className="info-box">
                            <Row>
                                <Col sm="4">
                                    <p className="step-info-title">Buy Tickets</p>
                                    <p className="step-info-description">{"Prices are set when the round starts, equal to 50 USD in Odin per ticket."}</p>
                                </Col>

                                <Col sm="4">
                                    <p className="step-info-title">Wait for the Draw</p>
                                    <p className="step-info-description">{"There is one draw every day alternating between 0 AM UTC and 12 PM UTC."}</p>
                                </Col>

                                <Col sm="4">
                                    <p className="step-info-title">Check for Prizes</p>
                                    <p className="step-info-description">{"Once the round’s over, come back to the page and check to see if you’ve won!"}</p>
                                </Col>
                            </Row>
                        </div>

                        <div className="info-box mt-5">
                            <Row style={{ alignItems: "center" }}>
                                <Col sm="8">
                                    <p className="step-info-title" style={{ fontWeight: "700" }}>Winning Criteria</p>
                                    <p className="step-info-title" style={{ fontWeight: "500", fontSize: "17px" }}>{"The digits on your ticket must match in the correct order to win."}</p>
                                    <p className="step-info-description">
                                        {"Here’s an example lottery draw, with two tickets, A and B."} <br />
                                        {"- Ticket A: The first 2 digits and the last 1 digit match, but the 3th digit is wrong, so this ticket only wins a “Match first 2” prize"} <br />
                                        {"- Ticket B: Even though the last 3 digits match, the first digit is wrong, so this ticket doesn’t win a prize."} <br />
                                        {"Prize brackets don’t ‘stack’: if you match the first 3 digits in order, you’ll only win prizes from the ‘Match 3’ bracket, and not from ‘Match 1’ and ‘Match 2’."}</p>
                                </Col>

                                <Col sm="4">
                                    <div className='freyja-center'>
                                        <img className="w-100" src={winingCreteria} alt="wining creteria" />
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div className="info-box mt-5">
                            <p className="step-info-title" style={{ fontWeight: "700" }}>Prize Funds</p>
                            <p className="step-info-description">{"The prizes for each lottery round come from three sources:"}</p>

                            <span className="step-info-title" style={{ fontWeight: "500", fontSize: "17px" }}>{"Ticket Purchases"}</span>
                            <p className="step-info-description">{"- 100% of the CAKE paid by people buying tickets that round goes back into the prize pools."}</p>

                            <span className="step-info-title" style={{ fontWeight: "500", fontSize: "17px" }}>{"Rollover Prizes"}</span>
                            <p className="step-info-description">{"- After every round, if nobody wins in one of the prize brackets, the unclaimed CAKE for that bracket rolls over into the next round and are redistributed among the prize pools."}</p>

                            <span className="step-info-title" style={{ fontWeight: "500", fontSize: "17px" }}>{"CAKE Injections"}</span>
                            <p className="step-info-description">{"- An average total of 35,000 CAKE from the treasury is added to lottery rounds over the course of a week. This CAKE is of course also included in rollovers! Read more in our guide to CAKE Tokenomics"}</p>
                        </div>
                    </Container>
                </div>


                <Modal
                    isOpen={showModal}
                    ariaHideApp={false}
                    className='modalcard box-shadow'
                >
                    <div className="right">
                        <div className="close-but float-right" onClick={handleModalCancel}>X</div>
                    </div>
                    <div className='modaldiv'>
                        <h3 className='modalHeader'>Buy Your Tickets </h3>
                    </div>
                    <div className='modal-divider' />
                    <p className="mt-2">{"Tickets: "} {ticketCount}</p>

                    <div className="custom-scroll-bar" style={{ overflowY: "auto" }}>
                        <Row className="text-center ml-0 mr-0">
                            {
                                CurrentOrderTickets.map((ticket, index) => {
                                    return (
                                        <Col xs="12" sm="6" key={index}>
                                            <div className="text-left"><span>#{index + 1}</span></div>
                                            <div className="d-flex justify-content-center" >
                                                <ReactPinField ref={el => (pinfieldsRef.current = [...pinfieldsRef.current, el])} className="pin-field" length={4} validate="0123456789" inputMode="numeric" />
                                            </div>
                                        </Col>
                                    );
                                })
                            }
                        </Row>
                    </div>

                    <Row className="mt-5">
                        <Col xs="6">
                            <div className="freyja-but mt-2" onClick={handleGenerateRandom}>Generate Random</div>
                        </Col>
                        <Col xs="6">
                            <div className="freyja-but mt-2" onClick={handleModalOk}>Confim and Buy</div>
                        </Col>
                    </Row>

                </Modal>

                <Modal
                    isOpen={showBoughtTicketsModal}
                    ariaHideApp={false}
                    className='modalcard box-shadow'
                    onRequestClose={() => {
                        setShowBoughtTicketsModal(false);
                    }}
                >
                    <div className="right">
                        <div className="close-but float-right" onClick={() => setShowBoughtTicketsModal(false)}>X</div>
                    </div>

                    <div className='modaldiv  mb-3'>
                        <h3 className='modalHeader'>My Tickets</h3>
                    </div>

                    <div className='custom-scroll-bar' style={{ overflowY: "auto", height: "520px" }}>
                        <Row>
                            {
                                lotteryData.MyLotteries[0].tickets.map((ticket, index) => {
                                    return (
                                        <Col className="mt-3" xs="6" sm="4" key={index}>
                                            <span className="ml-2">#{index}</span>
                                            <div className="ticket-box-lost">
                                                <div className="text-center" >
                                                    <span className="ml-2">{ticket.number[0]}</span>
                                                    <span className="ml-2">{ticket.number[1]}</span>
                                                    <span className="ml-2">{ticket.number[2]}</span>
                                                    <span className="ml-2">{ticket.number[3]}</span>
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })
                            }
                        </Row>
                    </div>

                </Modal>
            </div>
        </>
    );
};

export default GraceOfFreyja;
//@ts-nocheck
import {useEffect, useMemo, useState, useCallback} from 'react';
import * as anchor from '@project-serum/anchor';

import styled from 'styled-components';
import {Container, Snackbar} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Alert from '@material-ui/lab/Alert';
import {PublicKey} from '@solana/web3.js';
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletDialogButton} from '@solana/wallet-adapter-material-ui';
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from './candy-machine';
import {AlertState} from './utils';
import {Header} from './Header';
import {MintButton} from './MintButton';
import {GatewayProvider} from '@civic/solana-gateway-react';

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const MintContainer = styled.div``; // add your owns styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);
  const [isUserMinting, setIsUserMinting] = useState(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: undefined,
  });

  const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const refreshCandyMachineState = useCallback(async () => {
    if (!anchorWallet) {
      return;
    }

    if (props.candyMachineId) {
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );
        setCandyMachine(cndy);
      } catch (e) {
        console.log('There was a problem fetching Candy Machine state');
        console.log(e);
      }
    }
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const onMint = async () => {
    try {
      setIsUserMinting(true);
      document.getElementById('#identity')?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = {err: true};
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            true
          );
        }

        if (status && !status.err) {
          setAlertState({
            open: true,
            message: 'Congratulations! Mint succeeded!',
            severity: 'success',
          });
        } else {
          setAlertState({
            open: true,
            message: 'Mint failed! Please try again!',
            severity: 'error',
          });
        }
      }
    } catch (error) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsUserMinting(false);
    }
  };

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    props.connection,
    refreshCandyMachineState,
  ]);

  return (
    <div
      className={`d-flex flex-column justify-content-center mx-auto text-white`}>
      <style jsx>{`
        iframe {
          display: none;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: RGB(6, 21, 36) !important;
          // max-width: 1920px;
          margin: 0 auto;
        }

        code {
          font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
            monospace;
        }
        p {
          font-size: 1.25rem;
        }
        .punk-font {
          font-size: 2rem;
        }
        .Punks-Evolved-container {
          min-height: 37.5rem;
          background: url('WebBanner1reduced.jpg') no-repeat top center;
          background-size: cover;
        }

        .stay-involved {
          height: 100%;
          height: 43.75rem;
          background: url('./Web Banner 1 reduced.jpg') no-repeat center center;
          background-size: cover;
        }
        .stay-involved p {
          font-size: 1.5rem;
        }
        .socials {
          min-height: 500px;
        }
        .jitb-style-btn {
          height: 75px;
          font-size: 1.5rem;
          width: 300px;
          text-align: center;
          justify-content: center;
        }
        .progress {
          max-width: 50rem;
          width: 100%;
          margin: 0 auto;
        }
        .mint-input {
          z-index: 2;
          background-color: rgba(0, 0, 0, 0.25);
        }
        .mint-section-icons {
          z-index: 2;
          padding: 3px 1rem;
        }
        .header-section {
          height: 100%;
          max-height: 1200px;
          min-height: 800px;
          background: url('https://cdn.discordapp.com/attachments/905542266549047336/930642633343262740/banner_for_minting_website_3_png.png')
            no-repeat top center;
          background-size: cover;
        }
        .logo {
          height: 100%;
          min-height: 400px;
          max-height: 800px;
          left: 0;
        }
        .zin-1 {
          z-index: 1;
        }
        .js-font {
          min-width: 300px;
          max-height: 800px;
          z-index: 2;
        }
        .js-font img {
          font-family: 'Baskerville Old Face' !important;
          color: #ad0000;
          text-align: center;
        }
        .preview-gif {
          max-height: 300px;
          max-width: 300px;
        }
        .logo img {
          object-fit: cover;
        }
        svg {
          width: 32px;
          height: 32px;
          color: #fff;
          margin: 5px;
        }
        .collage-img {
          min-height: 360px;
          min-width: 360px;
          max-width: 1200px;
        }
        .nft-percent {
          z-index: 5;
          color: #000;
          background-color: transparent;
        }
        .bg-blood {
          background-color: #ad0000;
        }

        @media screen and (max-width: 1200px) {
          .mint-section-box,
          .header-section,
          .logo-xl {
            height: 100%;
            min-height: 1000px;
            max-height: 1200px;
          }
        }
        @media screen and (max-width: 768px) {
          .header-section {
            background: url('https://cdn.discordapp.com/attachments/905542266549047336/930576006455111691/banner_for_minting_website.jpg')
              no-repeat top right;
            background-size: cover;
          }
        }
        @media screen and (max-width: 576px) {
          .mint-section-box,
          .header-section,
          .logo-xl {
            height: 100%;
            min-height: 800px;
            max-height: 1200px;
          }
          .header-section {
            background: url('https://cdn.discordapp.com/attachments/905542266549047336/930576006455111691/banner_for_minting_website.jpg')
              no-repeat top right;
            background-size: cover;
          }
          p {
            font-size: 1.15rem;
          }
          .roadmap {
            min-height: 37rem;
          }
        }
        .w-90 {
          width: 70% !important;
        }
        .h-90 {
          height: 70% !important;
        }
      `}</style>
      {/* HEADER */}
      <div
        className={`header-section d-flex flex-column justify-content-center
            align-items-center h-100 w-100`}>
        <div
          className={`js-font d-flex flex-column align-items-center justify-content-center col col-md-6 px-3`}>
          <img
            src='https://cdn.discordapp.com/attachments/905542266549047336/930576119269302292/Punks_evolved_transparent_Interactive_LightMix.png'
            className={`h-90 w-90`}
            alt=''
          />

          <div className='container d-flex flex-column justify-content-center align-items-center p-3 border border-dark w-100 my-4'>
            MINT CLOSED!
          </div>
        </div>
      </div>
      {/* MINT SECTION */}

      {/* PROFILE INFO */}
      <div
        className={`container d-flex flex-column justify-content-center
            align-items-center px-3  px-md-5 py-5 mx-auto`}>
        <h1 className={`text-center punk-font mb-5`}>About Punks Evolved</h1>
        <p>
          Punks Evolved is the "genesis" project to all things 3D in our family
          of projects - it's the one that started it all and our premium airdrop
          pass to all things 3D
        </p>
        <p>
          Our first airdropped project was Jack In The Blocks with our next
          upcoming airdrop being for MetaWares Marketplace, the snapshot of
          which will be taken 2 weeks after our WL sale
        </p>
        <p>
          Punks Evolved is a 911 supply project so being part of our ecosystem
          has limited space and entitles you to airdrops and value added
          incentives for all developments we ever make, as well as royalties to
          MetaWares Marketplace
        </p>
        <p>
          There are over 115 variations of different rarities spread amongst 9
          categories of attributes and some truly wild combinations to claim for
          your own!
        </p>
      </div>

      {/* ROADMAP */}
      <div
        className={` roadmap mx-auto d-flex flex-row justify-content-center
            align-items-center`}>
        <img
          className={`text-center w-100 h-100 d-flex d-md-none`}
          src={
            'https://cdn.discordapp.com/attachments/905542266549047336/946346356396675102/Roadmap_squared_optimized_for_mobile.png'
          }
          alt='roadmap'
        />
        <img
          className={`text-center w-100 h-100 d-none d-md-flex`}
          src={
            'https://cdn.discordapp.com/attachments/905542266549047336/946346425292316682/Roadmap_Banner_optimized_and_clipped_for_web.png'
          }
          alt='roadmap'
        />
      </div>
      {/* FAQ */}
      <div
        className={`container d-flex flex-column justify-content-center
            align-items-center px-3  px-md-5 pt-5 text-capitalize`}>
        <h2 className='text-center my-3'>F.A.Q.</h2>
        <div className={`d-flex flex-column mx-auto mt-5`}>
          <ul className='fs-5'>
            <li>
              Who made Punks Evolved?
              <ul>
                <li>
                  Punks Evolved was crafted by an expert team of 3D Artists and
                  developers wanting to bring a fresh spin on the generative NFT
                  landscape. We wanted to maintain the essence of the 2D and
                  simplistic art styles the crypto space has grown to love while
                  taking it a step further by creating generative art in a 3
                  dimensional format
                </li>
              </ul>
            </li>
            <li>
              How can I purchase a Punk?
              <ul>
                <li>
                  Connect your wallet to the website and purchase through the
                  “mint" button
                </li>
              </ul>
            </li>
            <li>
              How much does a punk cost?
              <ul>
                <li>Each punk costs 0.65 SOL to mint</li>
              </ul>
            </li>
            <li>
              Where can I view my newly minted Punk?
              <ul>
                <li>You can view your punk in your phantom wallet</li>
              </ul>
            </li>
            <li>
              Is every punk truly unique?
              <ul>
                <li>
                  Yes! We’ve ensured there will be no duplicate punks, and all
                  will be 100% unique combinations
                </li>
              </ul>
            </li>
            <li>
              How many attributes are there
              <ul>
                <li>
                  There are 9 total attributes your punk can take on such as
                  Background, Head, Mouth, Eyes, Accents, Accesory, Skin, Gender
                  and Facial hair – all together there are over 115 variations
                  to draw from
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      {/* Punks Evolved */}
      <div
        className={`container-fluid Punks-Evolved-container d-flex flex-column justify-content-center
            align-items-center px-3 px-md-5 py-5`}>
        <div className={`d-flex flex-column  col-md-6 `}>
          <h1 className={`punk-font mb-5`}>Jack In The Blocks?</h1>
          <p>
            Community is everything in NFTs and we’d love to have you as part of
            ours! Join our Discords to stay up to date with both projects!
          </p>

          <div
            className={`d-flex flex-column flex-md-row justify-content-start align-items-center`}>
            <a
              className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 m-2 p-4`}
              href={'https://jackintheblocks.io/'}>
              Mint
            </a>
            <a
              className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 p-4`}
              href={'http://discord.gg/s99MhhmttM'}>
              Discord
            </a>
            <a
              className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 m-2 p-4`}
              href={'https://twitter.com/JackInTheBlocks'}>
              Twitter
            </a>
          </div>
        </div>
      </div>
      {/* SOCIALS*/}
      <div
        className={`container-fluid socials d-flex flex-column justify-content-center
            align-items-center px-3  px-md-5 py-5 flex-wrap`}>
        <div
          className={`d-flex flex-column flex-md-row justify-content-around align-items-center`}>
          <a
            className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2 p-4`}
            href={'https://opensea.io/collection/jackintheblocks'}>
            Magic Eden
          </a>
          <a
            className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2 p-4`}
            href={'https://discord.gg/s99MhhmttM'}>
            Discord
          </a>
          <a
            className={`jitb-style-btn d-flex flex-row align-items-center btn btn-light text-uppercase my-4 mx-2 p-4`}
            href={'https://twitter.com/EvolvedPunks'}>
            Twitter
          </a>
        </div>
      </div>
      <div className={`d-flex flex-row justify-content-start px-4`}>
        <p className={`m-0`}>© COPYRIGHT PUNKS EVOLVED 2022</p>
      </div>
    </div>
  );
};

export default Home;

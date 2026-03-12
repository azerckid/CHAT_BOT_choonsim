/**
 * 유저 evmAddress의 현재 CTC 잔액을 테스트넷 RPC로 조회
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const ADDRESSES = [
    { label: "azerckid@twitter.local", address: "0xd47d1CA6Ffd9dcBC98933c9133854dd62A1dA72d" },
    { label: "azerckid@gmail.com",     address: "0x270C8983faa1025D0DBB0476C84116A4D394EC4A" },
];

async function main() {
    const rpc = process.env.CTC_RPC_URL;
    if (!rpc) { console.error("CTC_RPC_URL 미설정"); process.exit(1); }

    console.log(`RPC: ${rpc}\n`);
    const provider = new ethers.JsonRpcProvider(rpc);

    for (const { label, address } of ADDRESSES) {
        try {
            const balanceWei = await provider.getBalance(address);
            const balanceCTC = ethers.formatEther(balanceWei);
            console.log(`${label}`);
            console.log(`  주소  : ${address}`);
            console.log(`  잔액  : ${balanceCTC} CTC (${balanceWei.toString()} wei)\n`);
        } catch (e) {
            console.log(`${label} → 오류: ${(e as Error).message}\n`);
        }
    }
}

main().catch(console.error);

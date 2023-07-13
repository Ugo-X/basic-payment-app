import { TransactionBuilder, Networks, Server, Operation, Asset, Memo } from 'stellar-sdk'

const horizonUrl = 'https://horizon-testnet.stellar.org'
const networkPassphrase = Networks.TESTNET

/**
 * Constructs and returns a Stellar transaction that contains a payment operaion(s) and an optional memo.
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string|string[]} opts.destination Public Stellar address(es) to receive the payment
 * @param {string} [opts.asset=native] Asset to be sent to the destination address(es) (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {number|string} opts.amount Amount of the asset to send in the payment
 * @param {string} [opts.memo] Memo to add onto the transaction
 * @returns {Promise<{
 *     transaction: string,
 *     network_passphrase: string,
 * }>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createPaymentTransaction({ source, destination, asset, amount, memo }) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })

    let sendAsset = Asset.native()
    if (asset !== 'native') {
        sendAsset = new Asset(asset.split(':')[0], asset.split(':')[1])
    }

    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    if (Array.isArray(destination)) {
        destination.map((dest) => {
            transaction.addOperation(Operation.payment({
                destination: dest,
                amount: amount.toString(),
                asset: sendAsset,
            }))
        })
    } else {
        transaction.addOperation(Operation.payment({
            destination: destination,
            amount: amount.toString(),
            asset: sendAsset,
        }))
    }

    let builtTransaction = transaction.setTimeout(300).build()
    console.log('$src/stellar/transactions.js createPaymentTransaction builtTransaction', builtTransaction)
    return {
        transaction: builtTransaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will create or modify a trustline on an account.
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.asset Asset to add/modify/remove trustline on the `source` account for (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {string|number} [opts.limit] Desired limit for the trustline on the `source` account (use '0' to delete the trustline)
 * @returns {Promise<{
 *     transaction: string,
 *     network_passphrase: string,
 * }>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createChangeTrustTransaction({ source, asset, limit }) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)

    let trustAsset = new Asset(asset.split(':')[0], asset.split(':')[1])
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })
    .addOperation(Operation.changeTrust({
        asset: trustAsset,
        limit: limit?.toString()
    }))
    .setTimeout(300)
    .build()

    console.log('$src/stellar/transactions.js createChangeTrustTransaction transaction', transaction)
    return {
        transaction: transaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}
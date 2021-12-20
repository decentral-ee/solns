const {
    PublicKey,
    clusterApiUrl,
    Connection
} = require("@solana/web3.js");
const {
    getHashedName,
    getNameAccountKey,
    NameRegistryState,
} = require("@solana/spl-name-service");

// Address of the SOL TLD
const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

async function getInputKey(input) {
  let hashed_input_name = await getHashedName(input);
  let inputDomainKey = await getNameAccountKey(
    hashed_input_name,
    undefined,
    SOL_TLD_AUTHORITY,
  );
  return { inputDomainKey: inputDomainKey, hashedInputName: hashed_input_name };
};

async function getDNSRecordAddress(nameAccount, type) {
  const hashedName = await getHashedName("\0".concat(type));
  const recordAccount = await getNameAccountKey(
    hashedName,
    undefined,
    nameAccount
  );
  return recordAccount;
}

module.exports = async (domain, subDomain) => {
    console.debug("domain:", domain);
    if (subDomain) console.debug("subDomain:", subDomain);

    let { inputDomainKey } = await getInputKey(domain);
    console.log("domainKey", inputDomainKey.toString("hex"));

    if (subDomain) {
        inputDomainKey = await getDNSRecordAddress(inputDomainKey, subDomain);
        console.log("subDomainKey", inputDomainKey.toString("hex"));
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    try {
        const registry = await NameRegistryState.retrieve(
          connection,
          inputDomainKey
        );
        const data = registry.data.toString().replaceAll("\0", "");
        console.log("parentName:", registry.parentName.toString("hex"));
        console.log("owner:", registry.owner.toString("hex"));
        console.log("data:", data);
        return data;
    } catch (err) {
        return null;
    }
};

//import required libraries
const dns = require("native-dns");
const util = require("util");
const solnsLookup = require("./solnslookup");

function parseSupportedDomains(domain) {
    let result = { supported: false };
    ["solns.link", "solns.test"].forEach((n) => {
        if (domain.endsWith("." + n)) {
            result = {
                supported: true,
                subDomain: domain.replace(new RegExp(`.${n}$`), ""),
            };
        }
    });
    return result;
}

function validateEntries(entriesRecord) {
    let entries;
    try {
        entries = JSON.parse(entriesRecord);
    } catch (err) {
        return { entriesValid: false };
    }
    if (entries.constructor.name !== "Array") {
        return { entriesValid: false };
    }
    return {
        entriesValid: true,
        entries,
    }
}

const server = dns.createServer();

server.on("request", async function (request, response) {
    console.debug("request.question", request.question);
    const { supported, subDomain } = parseSupportedDomains(request.question[0].name);
    console.debug("supported", supported);
    if (!supported) return response.send();
    console.debug("subDomain", subDomain);

    const entriesRecord = await solnsLookup(subDomain, "_solns");
    const { entriesValid, entries } = validateEntries(entriesRecord);
    console.debug("entriesValid", entriesValid);
    if (!entriesValid) return response.send();

    try {
        for (let i = 0; i < entries.length; i++){
            const entry = entries[i];
            switch (entry.type) {
                case "A":
                    response.answer.push(dns.A(entry));
                    break;
                case "CNAME":
                    response.answer.push(dns.CNAME(entry));
                    break;
                default:
            }
        }
    } finally {
        response.send();
    }
});

server.on("error", function (err, buff, req, res) {
  console.log(err.stack);
});

const port = process.env.PORT || 53;
console.log("Listening on " + port);
server.serve(port);

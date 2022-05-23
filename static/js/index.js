async function search_ans(){
    try{
        if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) return;
        document.querySelector("#search-div").classList.add("loading");
        let val = document.querySelector("#search-div>input").value;
        let ans = await WALLET.ans.functions.who_is(val.toString());
        let is_available = ans[0].id.eq("0");
        let price = await WALLET.ans.functions.get_nft_price(ans[0].id, ans[0].target);
        let for_sale = await WALLET.ans.functions.get_amount_for_sale(ans[0].id, ans[0].target);
        let fee = is_available? await WALLET.ans.functions.get_mint_fee() : await WALLET.ans.functions.get_deployer_fee(price.toString(), 1);
        document.querySelector("#ans-info-div").style.display = "flex"; 
        document.querySelector("#search-div").classList.remove("loading");
        document.querySelector("#ans").innerHTML = val;
        document.querySelector("#fee-label").innerHTML = `Fee ${chain_id_to_symbol(WALLET.web3.networkVersion)} ${parseFloat(ethers.utils.formatEther(fee[0].toString()))}`;
        document.querySelector("#ans-status").innerHTML = is_available?"Available":"Taken";
        let p = parseFloat(ethers.utils.formatEther(price.toString()));
        document.querySelector("#ans-price").innerHTML = `${chain_id_to_symbol(WALLET.web3.networkVersion)} ${p.toLocaleString()}`;


        if(ethers.BigNumber.from(for_sale.toString()).eq("0") && !is_available){
            document.querySelector("#ans-for-sale").innerHTML = "No";
            document.querySelector("#buy-ans-btn").disabled = true;
        }else{
            document.querySelector("#ans-for-sale").innerHTML = "Yes";
            document.querySelector("#buy-ans-btn").disabled = false;
        }

        if(is_available){
            document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.value=""})  
            return
        };

        document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.classList.add("loading")});
        let res = await fetch(`${IPFS_GATEWAY}/${ans[0].cid}/info.json`);
        let data = await res.json();

        document.querySelector("#ans-name").value = data.name;
        document.querySelector("#ans-about").value = data.about;
        document.querySelector("#ans-color").value = data.background_color;
        document.querySelector("#ans-github").value = data.github;
        document.querySelector("#ans-twitter").value = data.twitter;
        document.querySelector("#ans-website").value = data.website;
        document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.classList.remove("loading")});
        if(WALLET.user_address.toLowerCase()===ans[0].target.toLowerCase()){
            document.querySelector("#update-ans-btn").disabled = false;
            document.querySelector("#sell-ans-btn").disabled = false;
        }
    }catch(e){
        console.error(e);
        document.querySelector("#search-div").classList.remove("loading");
        document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.classList.remove("loading")});
    }
    
}


function chain_id_to_symbol(id){
    id = parseInt(id);
    switch (id) {
        case 1:
            return "Ξ"
        case 4:
            return "Ξ"
        case 137:
            return "Matic"
        case 80001:
            return "Matic" 
        default:
            return "?";
    }
}

document.addEventListener("DOMContentLoaded", async function(){
    await WALLET.setup();
    
    let ans_hint = document.querySelector("span#enter-hint");
    document.querySelector("#search-div>input").addEventListener("keyup", async function(event) {
        let val = event.target.value;
        if(val.length>0){
            ans_hint.style.display="flex";
        }else{
            ans_hint.style.display="none";
        }
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            event.preventDefault();
            await search_ans();
        }
    })
})
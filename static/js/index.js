let ans_data = null;
async function search_ans(){
    try{
        if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) return;
        document.querySelector("#search-div").classList.add("loading");
        let val = document.querySelector("#search-div>input").value;
        let ans = await WALLET.ans.who_is(val.toString());
        let is_available = ans.id.eq("0");
        let is_owner = WALLET.user_address.toLowerCase()===ans.target.toLowerCase();
        let for_sale = await WALLET.ans.get_amount_for_sale(ans.id, ans.target);
        let price = await WALLET.ans.get_nft_price(ans.id, ans.target);
        let fee = is_available? await WALLET.ans.get_mint_fee() : await WALLET.ans.get_deployer_fee(price.toString(), 1);
        document.querySelector("#ans-info-div").style.display = "flex"; 
        document.querySelector("#search-div").classList.remove("loading");
        document.querySelector("#ans").innerHTML = val;
        document.querySelector("#fee-label").innerHTML = `Buy Fee ${chain_id_to_symbol(WALLET.web3.networkVersion)} ${parseFloat(ethers.utils.formatEther(fee.toString()))}`;
        document.querySelector("#ans-status").innerHTML = is_available?"Available":"Taken";
        let p = parseFloat(ethers.utils.formatEther(price.toString()));
        document.querySelector("#ans-for-sale-price").value = p;
        document.querySelector("#ans-for-sale-price").readOnly = false
        document.querySelector("#chain-symbol").innerHTML = `${chain_id_to_symbol(WALLET.web3.networkVersion)}`;

        document.querySelector("#sell-ans-btn").innerHTML = "Set For Sale";
        document.querySelector("#sell-ans-btn").disabled = true;
        document.querySelector("#update-ans-btn").disabled = true;
        document.querySelector("#buy-ans-btn").disabled = true;
        document.querySelector("#cancel-sale-ans-btn").disabled = true;
        document.querySelector("#ans-for-sale").innerHTML = "No";
        
        if((!ethers.BigNumber.from(for_sale.toString()).eq("0") && !is_owner) || is_available ){
            document.querySelector("#ans-for-sale").innerHTML = "Yes";
            document.querySelector("#buy-ans-btn").disabled = false;
            document.querySelector("#ans-for-sale-price").readOnly = true;
        }

        if(!ethers.BigNumber.from(for_sale.toString()).eq("0") && is_owner){
            document.querySelector("#ans-for-sale").innerHTML = "Yes";
            document.querySelector("#sell-ans-btn").innerHTML = "Update Price"
            document.querySelector("#cancel-sale-ans-btn").disabled = false;
        }

        if(is_available){
            document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.value=""})  
            return
        };

        document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.classList.add("loading")});
        let res = await fetch(`${IPFS_GATEWAY}/${ans.cid}/info.json`);
        ans_data = await res.json();
        ans_data["ans"] = ans;
        ans_data["ans_value"] = val;
        document.querySelector("#ans-name").value = ans_data.name;
        document.querySelector("#ans-about").value = ans_data.about;
        document.querySelector("#ans-color").value = ans_data.background_color;
        document.querySelector("#ans-github").value = ans_data.github;
        document.querySelector("#ans-twitter").value = ans_data.twitter;
        document.querySelector("#ans-website").value = ans_data.website;
        document.querySelectorAll("#ans-info-div input, #ans-about").forEach((el)=>{el.classList.remove("loading")});
        if(is_owner){
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
    if(typeof WALLET === "undefined") {
        alert("WALLET Object Not found")
        return
    }

    await WALLET.setup();
    await HOSQ_PROVIDER.setup();
    if(await HOSQ_PROVIDER.is_ready()){
        await WALLET.update_user_ans(false);
    }
    
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


    const getComplementaryColor = (color = '') => {
        const colorPart = color.slice(1);
        const ind = parseInt(colorPart, 16);
        let iter = ((1 << 4 * colorPart.length) - 1 - ind).toString(16);
        while (iter.length < colorPart.length) {
           iter = '0' + iter;
        };
        return '#' + iter;
     }

    const upload_user_details = async() => {
        if(!await HOSQ_PROVIDER.is_ready()) throw "HOSQ PROVIDER not ready";
        let files = document.querySelector("input#ans-logo").files;
        files = typeof files ==="undefined"?[]:files;
        let info = {
            name: document.querySelector("input#ans-name").value,
            about: document.querySelector("textarea#ans-about").value,
            image: files.length===1? files[0].name: "",
            background_color: document.querySelector("input#ans-color").value,
            github: document.querySelector("input#ans-github").value,
            twitter: document.querySelector("input#ans-twitter").value,
            website: document.querySelector("input#ans-website").value,
            background_art: "",
            nft_type: "ans",
            type: "dir",
        }
        return await HOSQ_PROVIDER.upload_dir(files, true, false, info)
    }
    document.querySelector("input#ans-color").addEventListener("keyup", async function(event) {
        let val = event.target.value;
        if(val.length>4){
            ans_hint.style.display="flex";
            event.preventDefault();
            event.target.style.backgroundColor = val;
            if(val.includes("#", 0)){
                event.target.style.color = getComplementaryColor(val);
            }else{
                event.target.style.color = "var(--dark)";
            }
        }
    })

    document.querySelector("button#buy-ans-btn").addEventListener("click", async function(el){
        el.target.classList.add("loading");
        let ans = document.querySelector("#search-div>input").value;
        if(ans.length===0){
            el.target.classList.remove("loading");
            alert("Invalid ANS");
            return
        }
        
        let price = document.querySelector("input#ans-for-sale-price").valueAsNumber;
        price = isNaN(price)? 0:ethers.utils.parseEther(`${price}`).toString();
        
        try{
            if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) throw "Wallet not ready";
            let ans_details = await WALLET.ans.who_is(ans);
            let is_available = ans_details.id.eq("0");
            if(is_available){
                let res = await upload_user_details();
                if(res.status!==200) throw "Failed to upload files";
                let commit_bytes = await WALLET.ans.makeCommitment(ans, WALLET.user_address);
                let commit_res = await (await WALLET.ans.commit(commit_bytes, {from: WALLET.user_address})).wait();
                if(commit_res.status!==1) throw "Failed to commit ANS bytes";
                let mint_res = await (await WALLET.ans.mint_ans(price, ans, res.data.Hash, 
                                {from: WALLET.user_address, value: (await WALLET.ans.functions.get_mint_fee()).toString()})).wait();
                if(mint_res.status!==1) throw "Failed to mint ANS";
                el.target.classList.remove("loading");
                return
            }
            let for_sale = await WALLET.ans.get_amount_for_sale(ans_details.id, ans_details.target);
            if(!ethers.BigNumber.from(for_sale.toString()).eq("0")){
                let res = await upload_user_details();
                if(res.status!==200) throw "Failed to upload files";
                let fee = await WALLET.ans.get_total_fee(ans_details.id, 1, ans_details.target);
                console.log(fee.toString(), ans, ans_details.target, res.data.Hash);
                res = await (await WALLET.ans.transfer_update_ans(ans, ans_details.target, res.data.Hash, 
                    {from: WALLET.user_address, value: fee.toString()})).wait();
                if(res.status!==1) throw "Failed to mint ANS";
                el.target.classList.remove("loading");
                return
            }
            throw "ANS not available"
        }catch(e){
            console.error(e);
            el.target.classList.remove("loading");
            alert("Failed to buy ANS")
        }
        el.target.classList.remove("loading");
    })

    document.querySelector("button#sell-ans-btn").addEventListener("click", async function(el){
        el.target.classList.add("loading");
        try{
            if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) throw "Wallet not ready";
            if(ans_data===null) throw "ANS is not selected";
            let is_owner = WALLET.user_address.toLowerCase()===ans_data.ans.target.toLowerCase();
            if(!is_owner) throw "You Don't Own This ANS"
            let for_sale = await WALLET.ans.get_amount_for_sale(ans_data.ans.id, ans_data.ans.target);
            let price = document.querySelector("input#ans-for-sale-price").valueAsNumber;
            price = isNaN(price)? 0:ethers.utils.parseEther(`${price}`).toString();
            if(!ethers.BigNumber.from(for_sale.toString()).eq("0") && is_owner){
                let res = await (await WALLET.ans.update_nft_price(ans_data.ans.id.toString(), price, 
                                                            {from: WALLET.user_address})).wait();
                if(res.status!==1) throw res;
                el.target.classList.remove("loading");
                return
            }

            let res = await (await WALLET.ans.set_for_sale(ans_data.ans.id.toString(), 1, price, 
                                                            {from: WALLET.user_address})).wait();
            if(res.status!==1) throw res;
        }catch(e){
            console.error(e);
            el.target.classList.remove("loading");
            alert("Failed to set ANS for sale")
        }
        el.target.classList.remove("loading");
    })

    document.querySelector("button#cancel-sale-ans-btn").addEventListener("click", async function(el){
        el.target.classList.add("loading");
        try{
            if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) throw "Wallet not ready";
            if(ans_data===null) throw "ANS is not selected";
            let is_owner = WALLET.user_address.toLowerCase()===ans_data.ans.target.toLowerCase();
            if(!is_owner) throw "You Don't Own This ANS"
            let for_sale = await WALLET.ans.get_amount_for_sale(ans_data.ans.id, ans_data.ans.target);
            if(ethers.BigNumber.from(for_sale.toString()).eq("0")) throw "ANS NOT FOR SALE";

            let res = await (await WALLET.ans.set_not_for_sale(ans_data.ans.id.toString(), 1, 
                                                            {from: WALLET.user_address})).wait();
            if(res.status!==1) throw res;
        }catch(e){
            console.error(e);
            el.target.classList.remove("loading");
            alert("Failed to cancel ANS sale")
        }
        el.target.classList.remove("loading");
    })


    document.querySelector("button#update-ans-btn").addEventListener("click", async function(el){
        el.target.classList.add("loading");
        if(ans_data===null) throw "ANS is not selected";
        let is_owner = WALLET.user_address.toLowerCase()===ans_data.ans.target.toLowerCase();
        if(!is_owner) throw "You Don't Own This ANS"
        try{
            if(!await WALLET.is_ready() || !await WALLET.is_contract_ready()) throw "Wallet not ready";
            let res = await upload_user_details();
            if(res.status!==200) throw "Failed to upload files";
            res = await (await WALLET.ans.update_ans(ans_data.ans_value, res.data.Hash, 
                                                        {from: WALLET.user_address})).wait();
            if(res.status!==1) throw res;
        }catch(e){
            console.error(e);
            el.target.classList.remove("loading");
            alert("Failed to update ANS")
        }
        el.target.classList.remove("loading");
    })
})
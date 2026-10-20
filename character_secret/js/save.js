/*
 * モジュール: save.js
 * 役割: キャラクターデータの収集、JSON保存・読み込み、および共有URLの生成を担当します。
 */

function collect(){
    let d={
        portraitData,
        skillModifiers: JSON.parse(JSON.stringify(skillModifiers))
    };

    document.querySelectorAll('[data-save]').forEach(e=>
        d[e.id]=e.type==='checkbox'?e.checked:e.value
    );

    d.magics=[
        ...document.querySelectorAll('.unique-detail')
    ].map(c=>({
        magicName:c.querySelector('[data-field=magicName]').value,
        magicEffect:c.querySelector('[data-field=magicEffect]').value
    }));

    d.customUniqueMagics = [
        ...document.querySelectorAll(
            '#uniqueMagicOptions .custom-unique-magic'
        )
    ].map(label => ({
        name: label.dataset.magicName,
        checked: label.querySelector('[data-custom-unique]').checked
    }));


    d.customBasicMagics=[
        ...document.querySelectorAll('#basicMagicGrid .custom-basic-magic')
    ].map(field=>({
        name:field.dataset.magicName,
        value:field.querySelector('input').value
    }));
    d.customSpecialSkills = [
        ...document.querySelectorAll('#specialSkills [data-custom-special-skill]')
    ].map(row => ({
        name: row.querySelector('[data-custom-special-name]').value,
        allocation: row.querySelector('[data-custom-special-allocation]').value,
        base: row.querySelector('[data-custom-special-base]').value
    }));
    d.techniques=actionData('.technique');
    d.weapons=actionData('.weapon');
    return d;
}

function apply(d){
    portraitData = d.portraitData || '';

    skillModifiers = {
        combat: {
            拳: 0,
            蹴り: 0,
            回避: 0,
            カウンター: 0,
            弾き: 0,
            ...(d.skillModifiers?.combat || {})
        },
        search: {
            観察: 0,
            分析: 0,
            幸運: 0,
            知識: 0,
            五感: 0,
            追跡: 0,
            ...(d.skillModifiers?.search || {})
        }
    };

    portraitCanvasImage = null;
    characterBaseCanvas = null;

    showPortrait();

    document.querySelectorAll('[data-save]').forEach(e=>{if(d[e.id]!==undefined)e.type==='checkbox'?e.checked=!!d[e.id]:e.value=d[e.id]});
    document.querySelectorAll('#specialSkills [data-custom-special-skill]').forEach(row => row.remove());
    (d.customSpecialSkills || []).forEach(addCustomSpecialSkill);
    document.querySelectorAll(
        '#uniqueMagicOptions .custom-unique-magic'
    ).forEach(field => field.remove());

    (d.customUniqueMagics || []).forEach(magic => {
        addCustomUniqueMagic(magic.name, magic.checked);
    });

    document.querySelectorAll('#basicMagicGrid .custom-basic-magic')
        .forEach(field => field.remove());
    (d.customBasicMagics || []).forEach(magic => {
        addBasicMagic(magic.name, magic.value);
    });
    uniqueMagicDetails.innerHTML='';
    (d.magics||[]).forEach(addUniqueMagicDetail);
    techniques.innerHTML='';
    (d.techniques||[]).forEach(addTechnique);
    weapons.innerHTML='';
    (d.weapons||[]).forEach(addWeapon);
    if(!d.magics?.length)addUniqueMagicDetail();
    if(!d.techniques?.length)addTechnique();
    if(!d.weapons?.length)addWeapon();
    calculateAll()
    updateViewMode();
}

let savedCharacterSnapshot = null;
let unloadConfirmed = false;

function getCharacterSnapshot() {
    return JSON.stringify(collect());
}

function markCharacterSaved(snapshot = getCharacterSnapshot()) {
    savedCharacterSnapshot = snapshot;
}

function hasUnsavedCharacterChanges() {
    return savedCharacterSnapshot !== null &&
        savedCharacterSnapshot !== getCharacterSnapshot();
}

function returnToMypage() {
    if (hasUnsavedCharacterChanges() &&
        !confirm('編集した内容がJSON書き出しまたはアカウント保存されていません。保存せずにマイページへ戻りますか？')) {
        return;
    }

    unloadConfirmed = true;
    location.href = 'mypage.html';
}

window.addEventListener('beforeunload', event => {
    if (unloadConfirmed || !hasUnsavedCharacterChanges()) return;
    event.preventDefault();
    event.returnValue = '';
});

window.addEventListener('pageshow', () => {
    unloadConfirmed = false;
});

function exportJson(){
    let d=collect(),snapshot=JSON.stringify(d),a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.href=u;
    a.download=(charName.value||'character')+'.json';a.click();
    URL.revokeObjectURL(u);markCharacterSaved(snapshot)
}

async function shareByUrl() {
    try {
        const saved = await saveCharacterToAccount();
        if (!saved) return;

        const id = accountCharacterId();
        if (!id) throw Error("共有IDを取得できませんでした。");

        const stored = await accountApi("/api/characters/" + encodeURIComponent(id));
        if (portraitData && !stored.character?.characterData?.portraitData) {
            throw Error("立ち絵がデータベースに保存されていません。Workerを更新して再Deployしてください。");
        }

        const shareUrl = new URL(location.origin + location.pathname);
        shareUrl.searchParams.set("shareId", id);

        try {
            await navigator.clipboard.writeText(shareUrl.toString());
            msg("saveMessage", "立ち絵を含む共有URLをコピーしました。", "success");
        } catch {
            prompt("共有URLをコピーしてください。", shareUrl.toString());
        }
    } catch (error) {
        msg("saveMessage", error.message, "warning");
    }
}


function importJson(e){
    let r=new FileReader();
    r.onload=()=>{try{
        apply(JSON.parse(r.result));
        msg('saveMessage','読み込みました。','success')
    }
    catch{
        msg(
            'saveMessage',
            '読み込みに失敗しました。',
            'warning')
        }
    };
    if(e.target.files[0])r.readAsText(e.target.files[0])
}


/* アカウントDBへのキャラクター保存・読み込み */
const ACCOUNT_API_BASE = "https://magicstart-apie.yu2005yu-h-072.workers.dev";
function accountToken(){return sessionStorage.getItem("magicstart_session_token");}
async function accountApi(path,options={}){
 const token=accountToken();if(!token)throw Error("ログインしてください。");
 const response=await fetch(ACCOUNT_API_BASE+path,{...options,headers:{Authorization:"Bearer "+token,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
 const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||"通信エラー "+response.status);return result;
}
function accountCharacterId(){return new URLSearchParams(location.search).get("characterId");}
async function loadSharedCharacterFromUrl() {
 const id = new URLSearchParams(location.search).get("shareId");
 if (!id) return;
 try {
  const response = await fetch(ACCOUNT_API_BASE + "/api/share/" + encodeURIComponent(id));
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(result.error || "共有キャラクターを読み込めませんでした。");
  apply(result.character.characterData || {});
  if (!charName.value) charName.value = result.character.characterName || "";
  setMode("view");
  msg("saveMessage", "共有キャラクターを読み込みました。", "success");
 } catch (error) {
  msg("saveMessage", error.message, "warning");
 }
}
async function loadCharacterFromAccount(){
 const id=accountCharacterId();if(!id)return;
 try{const result=await accountApi("/api/characters/"+encodeURIComponent(id));apply(result.character.characterData||{});if(!charName.value)charName.value=result.character.characterName||"";msg("saveMessage","アカウントから読み込みました。","success");}
 catch(error){msg("saveMessage",error.message,"warning");if(error.message==="ログインが必要です")location.href="login.html";}
}
const MAX_ACCOUNT_CHARACTER_BYTES = 1400000;
async function prepareAccountCharacterData() {
 const data = collect();
 const sizeInBytes = () => new TextEncoder().encode(JSON.stringify(data)).byteLength;
 if (sizeInBytes() <= MAX_ACCOUNT_CHARACTER_BYTES) return data;
 if (!data.portraitData) throw Error("キャラクターデータが大きすぎます。");

 const image = new Image();
 await new Promise((resolve, reject) => {
  image.onload = resolve;
  image.onerror = () => reject(Error("立ち絵を読み込めませんでした。"));
  image.src = data.portraitData;
 });

 const canvas = document.createElement("canvas");
 const context = canvas.getContext("2d");
 if (!context) throw Error("立ち絵を圧縮できませんでした。");

 for (const scale of [1, 0.85, 0.7, 0.55, 0.4, 0.3]) {
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
   data.portraitData = canvas.toDataURL("image/webp", quality);
   if (sizeInBytes() <= MAX_ACCOUNT_CHARACTER_BYTES) return data;
  }
 }

 throw Error("立ち絵を含むデータが大きすぎます。立ち絵画像を小さくしてください。");
}
async function saveCharacterToAccount(){
 const snapshot = getCharacterSnapshot();
 const name=charName.value.trim();if(!name){msg("saveMessage","先にキャラクター名を入力してください。","warning");charName.focus();return false;}
 const id=accountCharacterId(),path=id?"/api/characters/"+encodeURIComponent(id):"/api/characters";
 try{const characterData=await prepareAccountCharacterData();const result=await accountApi(path,{method:id?"PUT":"POST",body:JSON.stringify({characterName:name,characterData})});if(!id&&result.character?.characterId){const next=new URL(location.href);next.searchParams.set("characterId",result.character.characterId);history.replaceState(null,"",next);}markCharacterSaved(snapshot);msg("saveMessage","アカウントに保存しました。","success");return true;}
 catch(error){msg("saveMessage",error.message,"warning");return false;}
}



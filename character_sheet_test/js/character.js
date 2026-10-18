/*
 * モジュール: character.js
 * 役割: 立ち絵の読み込み・表示・削除と、ココフォリア用データの生成を担当します。
 */

function loadPortrait(e){
    let f=e.target.files[0];if(!f)return;
    let r=new FileReader();
    r.onload=()=>{let img=new Image();
        img.onload=()=>{let max=900,scale=Math.min(1,max/Math.max(img.width,img.height)),
            cv=document.createElement('canvas');
            cv.width=Math.round(img.width*scale);
            cv.height=Math.round(img.height*scale);
            cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
            portraitData=cv.toDataURL('image/png');
            portraitCanvasImage=null;
            showPortrait();
        };
        img.src=r.result
    };
    r.readAsDataURL(f)
}
            
function showPortrait(){
    portraitPreview.style.display=portraitData?'block':'none';portraitEmpty.style.display=portraitData?'none':'grid';
    if(portraitData)portraitPreview.src=portraitData
}

function clearPortrait(){
    portraitData='';
    portraitCanvasImage=null;
    portraitFile.value='';
    showPortrait()
}

function refExpr(ref,mult,add){
    let base=ref==='none'?'0':`{${statName(ref)}}`,m=Number(mult??1),n=Number(add||0);
    let expr=m===1?base:`(${base})*${m}`;
    if(n!==0) expr+=n>0?`+${n}`:`${n}`;
    return expr;
}

function skillCommandBonus(category, skill) {
    const bonus = Number(skillModifiers[category]?.[skill] || 0);

    if (bonus === 0) return '';
    return bonus > 0 ? `+${bonus}` : String(bonus);
}

function cocofolia(){
    calculateAll();
    let v=vals(),
    cmd=cocDiceCommand.value,
    params=[
        ['筋力',v.str],
        ['正確性',v.acc],
        ['俊敏性',v.agi],
        ['知識',v.know],
        ['思考力',v.think],
        ['容姿',v.looks],
        ['幸運',v.luck],
        ['感情値',v.emotion],
        ['総魔力量',v.mp]
    ].map(([label,value])=>({label,value:String(value)}));
    let lines=[
        '// ステータス判定',
        `${cmd}<={筋力} 【筋力】`,
        `${cmd}<={正確性} 【正確性】`,
        `${cmd}<={俊敏性} 【俊敏性】`,
        `${cmd}<={知識} 【知識】`,
        `${cmd}<={思考力} 【思考力】`,
        `${cmd}<={容姿} 【容姿】`,
        `${cmd}<={幸運} 【幸運】`,
        `${cmd}<={感情値} 【感情値】`,
        '// 通常戦闘技能',
        `${cmd}<={正確性}+60${skillCommandBonus('combat','拳')} 【拳】`,
        `${cmd}<={正確性}+30${skillCommandBonus('combat','蹴り')} 【蹴り】`,
        `${cmd}<=min({正確性}+{俊敏性},90)${skillCommandBonus('combat','回避')} 【回避】`,
        `${cmd}<={正確性}${skillCommandBonus('combat','カウンター')} 【カウンター】`,
        `${cmd}<={正確性}${skillCommandBonus('combat','弾き')} 【弾き】`,
        '// 探索技能',
        `${cmd}<={正確性}+40${skillCommandBonus('search','観察')} 【観察】`,
        `${cmd}<={思考力}+30${skillCommandBonus('search','分析')} 【分析】`,
        `${cmd}<={幸運}${skillCommandBonus('search','幸運')} 【幸運】`,
        `${cmd}<={知識}*3${skillCommandBonus('search','知識')} 【知識】`,
        `${cmd}<={正確性}*3${skillCommandBonus('search','五感')} 【五感】`,
        `${cmd}<={俊敏性}+{正確性}+{幸運}${skillCommandBonus('search','追跡')} 【追跡】`,

        ...(() => {
            const specialSkillLines = [
                [N('sp_disguise'), `${cmd}<=${N('sp_disguise')} 【変装】`],
                [N('sp_voice'), `${cmd}<=${N('sp_voice')}+{正確性} 【変声】`],
                [N('sp_negotiate'), `${cmd}<=${N('sp_negotiate')} 【交渉】`],
                [N('sp_authority'), `${cmd}<=${N('sp_authority')} 【権威】`],
                [N('sp_charm'), `${cmd}<=${N('sp_charm')}+{容姿} 【魅了】`],
                [N('sp_psychology'), `${cmd}<=${N('sp_psychology')}+{思考力} 【心理学】`],
                [N('sp_steal'), `${cmd}<=${N('sp_steal')}+{正確性} 【盗み】`],
                [N('sp_shooting'), `${cmd}<=${N('sp_shooting')} 【射撃】`],
                [N('sp_jump'), `${cmd}<=${N('sp_jump')}+{筋力} 【跳躍】`]
            ];

            document.querySelectorAll('#specialSkills [data-custom-special-skill]').forEach(row => {
                const allocation = Number(row.querySelector('[data-custom-special-allocation]').value || 0);
                const name = row.querySelector('[data-custom-special-name]').value.trim();
                const base = row.querySelector('[data-custom-special-base]').value;
                if (allocation > 0 && name) {
                    const bonus = base === 'none' ? '' : `+{${statName(base)}}`;
                    specialSkillLines.push([allocation, `${cmd}<=${allocation}${bonus} 【${name}】`]);
                }
            });

            const activeSkills = specialSkillLines
                .filter(([allocation]) => allocation > 0)
                .map(([, line]) => line);

            return activeSkills.length > 0
                ? ['// 特殊技能', ...activeSkills]
                : [];
        })()

    ];

    let ts=actionData('.technique'),ws=actionData('.weapon');
    if(ts.length)lines.push('// 技');
    ts.forEach(t=>{
        const name = t.name || '名称未設定';
        lines.push(`${cmd}<=${refExpr(t.ref,t.mult,t.add)} 【${name}】`);
        if(t.mp !== '') {
            lines.push(`:MP-${t.mp} 【消費MP:${name}】`);
        }
        if(t.maintainMp !== '') {
            lines.push(`:MP-${t.maintainMp} 【維持MP:${name}】`);
        }
        if(t.damage) {
            lines.push(`${t.damage} 【${name}・ダメージ】`);
        }
    });

    if(ws.length)lines.push('// 武器');
    ws.forEach(w=>{
        lines.push(`${cmd}<=${refExpr(w.ref,w.mult,w.add)} 【${w.name||'名称未設定'}】`);
        if(w.damage)lines.push(`${w.damage} 【${w.name||'名称未設定'}・ダメージ】`)
        }
    );
    return {
        kind:'character',
        data:{
            name:charName.value||'ダイス振り男',
            initiative:v.agi,
            externalUrl:null,
            iconUrl:null,
            params,
            status:[
                {label:'HP',value:v.hp,max:v.hp},
                {label:'MP',value:v.mp,max:v.mp},
                {label:'感情値',value:v.emotion,max:100}
            ],
            commands:lines.join('\n'),
            memo:[
                characterMemo.value
            ].join('\n')
        }
    }
}
            

async function outputCocofolia(){
    cocofoliaOutput.value=JSON.stringify(cocofolia());

    try{
        await navigator.clipboard.writeText(cocofoliaOutput.value);
        msg('cocofoliaMessage','生成してコピーしました。','success');
    }
    catch{
        cocofoliaOutput.select();
        document.execCommand('copy');
        msg('cocofoliaMessage','生成してコピーしました。','success');
    }
}


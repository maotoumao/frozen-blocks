
const modes = [{
    id: 'easyMode',
    title: '简单模式',
    params: {
        vertNums: 2,
        horiNums: 3,
        shuffleTimes: 50
    }
}, {
    id: 'hardMode',
    title: '困难模式',
    params: {
        vertNums: 4,
        horiNums: 6,
        shuffleTimes: 70
    }
},{
    id: 'nightmareMode',
    title: '噩梦模式',
    params: {
        vertNums: 6,
        horiNums: 8,
        shuffleTimes: 110
    }
}, {
    id: 'insaneMode',
    title: '地狱模式',
    params: {
        vertNums: 10,
        horiNums: 15,
        shuffleTimes: 200
    }
}]


const scripts = [
    'libs/EVA.min.js',
    'libs/pixi.min.js',
    'libs/EVA.rendererAdapter.min.js',
    'libs/EVA.plugin.renderer.min.js',
    'libs/EVA.plugin.renderer.img.min.js',
    'libs/EVA.plugin.renderer.event.min.js',
    'game.js'
];

chrome.action.onClicked.addListener(tab => {
    for(let script of scripts) {
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            files: [script]
        })
    }
})




chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'screencap') {
        port.onMessage.addListener(() => {
            chrome.tabs.captureVisibleTab().then((res) => {
                port.postMessage(res)
            })
        })
    }
})


chrome.contextMenus.removeAll(() => {
    // init context menus
    for (let i = 0; i < modes.length; ++i) {
        chrome.contextMenus.create({
            id: modes[i].id,
            title: modes[i].title,
            contexts: ['all'],
            type: 'radio'
        })
    }
    chrome.contextMenus.create({
        id: 'github',
        title: 'Github',
        contexts: ['all'],
    })
    chrome.contextMenus.create({
        id: 'aboutme',
        title: '联系作者',
        contexts: ['all'],
    });


    chrome.contextMenus.onClicked.addListener(({ menuItemId }) => {
        if(menuItemId === 'github') {
            chrome.tabs.create({
                url: 'https://github.com/maotoumao/frozen-blocks.git'
            })
            return;
        }
        if(menuItemId === 'aboutme') {
            chrome.tabs.create({
                url: 'http://blog.upup.fun'
            })
            return;
        }
        chrome.storage.sync.set({ mode: modes.find(item => item.id === menuItemId) });
    })
    
    chrome.storage.sync.get('mode', (_mode) => {
        const mode = _mode && _mode.mode;
        if (!mode) {
            chrome.storage.sync.set({ mode: modes[0] });
            chrome.contextMenus.update(modes[0].id, {
                checked: true
            })
            return;
        }
        
        modes.forEach(_m => {
            chrome.contextMenus.update(_m.id, {
                checked: _m.id === mode.id
            })
        })
    
    })
    

});



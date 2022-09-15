onmessage = function(settings) {
    this.self.parseMessages(settings.data);
};

async function parseMessages(settings) {
    console.log(settings);
    let days = settings.historyLength;
    let today = new Date();
    let filter = new Date(today.getFullYear(), today.getMonth(), today.getDate()-days).getTime();
    let includeRollMessages = settings.includeRolls;
    let targets = settings.targets;

    let baseMessages = null;
    if (settings.fvttGeneration >= 10) {
        baseMessages = settings.messages.filter(m => m.timestamp >= filter && m.whisper.includes(settings.userId)).sort((a, b) => { return a.timestamp > b.timestamp ? -1 : 1; });
        if (!includeRollMessages) { baseMessages = baseMessages.filter(m => m.roll === undefined); }
    } else {
        baseMessages = settings.messages.filter(m => m.data.timestamp >= filter && m.data.whisper.includes(settings.userId)).sort((a, b) => { return a.data.timestamp > b.data.timestamp ? -1 : 1; });
        if (!includeRollMessages) { baseMessages = baseMessages.filter(m => m.data.roll === undefined); }
    }

    let toRender = [];
    //Filter now based on selected targets
    if (targets && targets.length > 0 && !targets.includes('GM')) {
        for (let target of targets) {
            toRender = settings.fvttGeneration >= 10 ? toRender.concat(baseMessages.filter(m => m.user === target || m.whisper.includes(target))) : toRender.concat(baseMessages.filter(m => m.data.user === target || m.data.whisper.includes(target)));
        }
    } else {
        toRender = toRender.concat(baseMessages);
    }

    if (toRender.length > 500) {
        //Too many to go through, let's cut it down to size
        toRender = toRender.slice(0,500);
    }

    postMessage(toRender);
}
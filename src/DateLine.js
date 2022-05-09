const { difference } = require("lodash");

const spaces = [
    [1, "month", getPartSize("month")],
    [3, "month", getPartSize("month") * 3],
    [6, "month", getPartSize("month") * 6],
    [1, "year", getPartSize("year")],
    [2, "year", getPartSize("year") * 2],
    [5, "year", getPartSize("year") * 5],
    [10, "year", getPartSize("year") * 10],
    [20, "year", getPartSize("year") * 20],
    [50, "year", getPartSize("year") * 50],
    [100, "year", getPartSize("year") * 100]
]

const months = [
    "Jan",
    "Feb", 
    "Mar", 
    "Apr", 
    "May", 
    "Jun", 
    "Jul", 
    "Aug", 
    "Sep", 
    "Oct", 
    "Nov", 
    "Dec", 
]

class DateLine extends HTMLElement{

    static get observedAttributes(){
        return ['width', 'height']
    }

    get canvas(){
        return this.childNodes[0];
    }

    get value(){
        return (this.right + this.left) / 2
    }

    get visRange(){
        return this.right - this.left;
    }

    get maxRange(){
        return this.latest - this.earliest;
    }

    getAttribute = function(name, def){
        let att = this.attributes.getNamedItem(name);
        if(att != null) return att.value;
        return def;
    }
    
    constructor(){
        super();

        this.earliest = Date.parse(this.getAttribute("min", "0000-01-01"));
        this.latest = Date.parse(this.getAttribute("max", "2099-12-31"));
        this.left = this.earliest;
        this.right = this.latest;

        this.style.width = this.getAttribute("width", "150px");
        this.style.height = this.getAttribute("height", "30px");

        this.res = parseRes(this.getAttribute("res", "1 month"));
        this.style.display = "inline-block";

        const canvas = document.createElement("canvas");
        canvas.width = this.clientWidth;
        canvas.height = this.clientHeight;
        this.appendChild(canvas)

        this.zoom = 0
        this.onwheel = this.scrollZoom;
        this.onmousedown = (e) => { this.dragging = true }
        document.addEventListener("mouseup", (e) => { this.dragging = false })
        document.addEventListener("mousemove", (e) => { if(this.dragging) this.onDrag(e) })

        // This is needed to update the canvas whenever the style changes
        var observer = new MutationObserver((mutations) => {
            this.updateStyle();
        });
        observer.observe(this, { attributes: true, attributeFilter: ["style"]});
    }

    attributeChangedCallback(name, oldValue, newValue){
        this.updateStyle();
    }

    onDrag = function(e){
        var delta = e.movementX / this.canvas.width;
        var pan = this.getPan(-delta * this.visRange)
        this.left += pan;
        this.right += pan;
        this.redrawCanvas();
    }

    getPan = function(value){
        return coerceIn(value, this.earliest - this.value, this.latest - this.value)
    }

    scrollZoom = function(e){
        e.preventDefault();

        
        var minX = this.canvas.getBoundingClientRect().left;
        var canvasX = e.clientX - minX;
        var relativeX = canvasX / this.canvas.clientWidth;
        var range = this.visRange;
        // Still is the date where the cursor is, and so is the date that should stay in place
        var still = this.left + range * relativeX;

        // Pan sideways by scrolling horizontally
        var pan = this.getPan(e.deltaX * 0.002 * range)
        still += pan;

        // Zoom in by scrolling vertically
        var mult = coerceIn(1.2 ** (e.deltaY * 0.01), this.res / range, this.maxRange / range);
        range *= mult;
        // Then left and right dates should be moved, but limited to the earliest and latest dates
        this.left = still - relativeX * range;
        this.right = still + (1 - relativeX) * range;

        // By zooming in on a value outside the limits the value can move outside the limits
        // This part corrects that mistake
        if(this.value < this.earliest){
            var dif = this.earliest - this.value;
            this.left += dif;
            this.right += dif;
        }
        else if(this.value > this.latest){
            var dif = this.latest - this.value;
            this.left += dif;
            this.right += dif;
        }

        this.redrawCanvas();
    }

    redrawCanvas = function(){
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = `${Math.floor(this.canvas.height * 0.3)}px Arial`
        ctx.textAlign = "center"

        var l = new Date(this.left);
        var r = new Date(this.right);

        // Space is the amount of time in range on the canvas, and num and part are decided based on that
        var space = this.visRange;
        var spacing = spaces.find((e) => e[2] > space * 0.75 * this.canvas.height / this.canvas.width);
        var [num, part] = spacing.slice(0, 2);
        var dates = getEveryMultiple(num, part, l, r)
        
        var index = Math.max(0, spaces.indexOf(spacing) - 2);
        var subSpacing = spaces[index];
        var [subNum, subPart] = subSpacing.slice(0, 2);
        var subDates = getEveryMultiple(subNum, subPart, l, r);
        
        this.cssStyle = getComputedStyle(this)
        this.drawMarkers(ctx, l, r, subDates);

        this.drawDates(ctx, l, r, dates, part);
        ctx.fillStyle = this.cssStyle.color;
        ctx.fillText(new Date(this.value).getUTCFullYear(), this.canvas.width * 0.5, this.canvas.height * 0.97);
        this.drawPointer(ctx);

        this.dispatchEvent(new Event("change", {
            target: this
        }))
    }

    drawMarker = function(ctx, delta, width, height){
        ctx.fillRect(delta * this.canvas.width - width/2, 0, width, height * this.canvas.height);
    }
    
    drawMarkers = function(ctx, l, r, dates){
        ctx.fillStyle = this.cssStyle.caretColor;
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            this.drawMarker(ctx, delta, 1, 0.3)
        }
    }

    drawDates = function(ctx, l, r, dates, part){
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            var text = part == "month" ?
                months[date.getMonth()].replace("Jan", date.getUTCFullYear()) :
                getPart(part, date).toString();
            ctx.fillStyle = this.cssStyle.caretColor;
            this.drawMarker(ctx, delta, 2, 0.4);
            ctx.fillStyle = this.cssStyle.color;
            ctx.fillText(text, this.canvas.width * delta, this.canvas.height * 0.7);
        }
    }

    drawPointer = function(ctx){
        ctx.fillStyle = this.cssStyle.stopColor;
        ctx.beginPath();
        ctx.moveTo(0.46 * this.canvas.width, 0);
        ctx.lineTo(0.54 * this.canvas.width, 0);
        ctx.lineTo(0.5 * this.canvas.width, 0.25 * this.canvas.height);
        ctx.fill();
    }

    updateStyle = function(){
        this.canvas.width = this.clientWidth;
        this.canvas.height = this.clientHeight;
        this.redrawCanvas();
    }
}

function coerceIn(num, min, max){
    return Math.max(Math.min(num, max), min);
}

function parseRes(res){
    let [num, part] = res.split(" ")
    let size = getPartSize(part) * parseInt(num);
    if(typeof size == "number" && !isNaN(size)){
        return size
    }
    console.warn(`Could not parse res ${res} for DateLine`)
    return getPartSize("month")
}

function getPartOffset(part, offset){
    if(offset == 0) return part;

    var parts = ["day", "month", "year"];
    var index = parts.indexOf(part);
    if(index == -1) return part;

    while(index + offset < 0) offset += parts.length
    while(index + offset >= parts.length) offset -= parts.length

    return parts[index + offset];
}

function getPartSize(part){
    switch(part){
        case "year": 
        case "years": return 3.154e10;
        case "month": 
        case "months": return 2.628e9;
        case "day": 
        case "days": return 8.6407e7;
    }
}

function getPart(part, date){
    switch(part){
        case "year": 
        case "years": return date.getUTCFullYear();
        case "month": 
        case "months": return date.getUTCMonth() + 1;
        case "day": 
        case "days": return date.getUTCDay();
    }
}

function setPart(part, date, value){
    switch(part){
        case "year": return date.setUTCFullYear(value);
        case "month": return date.setUTCMonth(value - 1);
        case "day": return date.setUTCDay(value);
    }
    return date;
}

function getEveryMultiple(mag, part, leftDate, rightDate){

    var leftPart = getPart(part, leftDate)
    var rightPart = getPart(part, rightDate)

    switch(part){
        case "year": {
            var firstPart = leftPart - (leftPart % mag) + mag;
            var lastPart = rightPart - (rightPart % mag);

            var array = [...Array((lastPart - firstPart) / mag + 1).keys()].map(n => firstPart + n * mag);
            var dates = array.map(n => new Date(n, 0, 1));
            return dates;
        }
        case "month": {
            var firstPart = leftPart - ((leftPart + 1) % mag) - mag;
            var lastPart = rightPart - ((rightPart + 1) % mag);

            var firstYear = leftDate.getUTCFullYear();
            var lastYear = rightDate.getUTCFullYear();
            lastPart += (lastYear - firstYear) * 12;
            
            var array = [...Array((lastPart - firstPart) / mag + 1).keys()].map(n => firstPart + n * mag);
            var dates = array.map(n => new Date(firstYear, n + 1, 1));
            return dates;
        }
        
    }
    
}

module.exports = DateLine;
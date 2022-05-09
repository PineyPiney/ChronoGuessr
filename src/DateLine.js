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

    get canvas(){
        return this.childNodes[0];
    }

    get value(){
        return (this.right + this.left) / 2
    }

    get range(){
        return this.right - this.left;
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

        this.res = parseRes(this.getAttribute("res", "1 month"));
        

        this.style.width = "250px";
        this.style.height = "40px";
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

        this.redrawCanvas();
    }

    getPan = function(value){
        if(value > 0) return Math.min(value, this.latest - this.right)
        else return Math.max(value, this.earliest - this.left)
    }

    scrollZoom = function(e){
        e.preventDefault();

        // Still is the date where the cursor is, and so is the date that should stay in place
        var minX = this.canvas.getBoundingClientRect().left;
        var canvasX = e.clientX - minX;
        var relativeX = canvasX / this.canvas.clientWidth;
        var range = this.range;
        var still = this.left + range * relativeX;

        // Scroll sideways by scrolling horizontally
        var pan = this.getPan(e.deltaX * 0.002 * range)
        still += pan;

        // Zoom in by scrolling vertically
        // Then left and right dates should be moved, but limited to the earliest and latest dates
        var mult = Math.max(1.2 ** (e.deltaY * 0.01), this.res / range)
        this.left = Math.max(still - relativeX * range * mult, this.earliest);
        this.right = Math.min(still + (1 - relativeX) * range * mult, this.latest);

        this.redrawCanvas();
    }

    onDrag = function(e){
        var delta = e.movementX / this.canvas.width;
        var pan = this.getPan(-delta * this.range)
        this.left += pan;
        this.right += pan;
        this.redrawCanvas();
    }

    redrawCanvas = function(){
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "12px Arial"
        ctx.textAlign = "center"

        var l = new Date(this.left);
        var r = new Date(this.right);

        // Space is the amount of time in range on the canvas, and num and part are decided based on that
        var space = this.right - this.left;
        var spacing = spaces.find((e) => e[2] > space / 8);
        var [num, part] = spacing.slice(0, 2);
        var dates = getEveryMultiple(num, part, l, r)
        
        var index = Math.max(0, spaces.indexOf(spacing) - 2);
        var subSpacing = spaces[index];
        var [subNum, subPart] = subSpacing.slice(0, 2);
        var subDates = getEveryMultiple(subNum, subPart, l, r);
        
        this.cssStyle = getComputedStyle(this)
        this.drawMarkers(ctx, l, r, subDates);

        this.drawDates(ctx, l, r, dates, part);
        ctx.fillText(new Date(this.value).getUTCFullYear(), this.canvas.width * 0.5, this.canvas.height);
        this.drawPointer(ctx);

        this.dispatchEvent(new Event("change", {
            target: this
        }))
    }

    drawMarker = function(ctx, delta, width, height){
        ctx.fillRect((delta - (width / 2)) * this.canvas.width, 0, width * this.canvas.width, height * this.canvas.height);
    }
    
    drawMarkers = function(ctx, l, r, dates){
        ctx.fillStyle = this.cssStyle.caretColor;
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            this.drawMarker(ctx, delta, 0.01, 0.3)
        }
    }

    drawDates = function(ctx, l, r, dates, part){
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            var text = part == "month" ?
                months[date.getUTCMonth()] :
                getPart(part, date).toString();
            ctx.fillStyle = this.cssStyle.caretColor;
            this.drawMarker(ctx, delta, 0.01, 0.4);
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
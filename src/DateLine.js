const spaces = {
    "1 month": getPartSize("month"),
    "3 month": getPartSize("month") * 3,
    "6 month": getPartSize("month") * 6,
    "1 year": getPartSize("year"), 
    "2 year": getPartSize("year") * 2, 
    "5 year": getPartSize("year") * 5, 
    "10 year": getPartSize("year") * 10,
    "20 year": getPartSize("year") * 20, 
    "50 year": getPartSize("year") * 50, 
    "100 year": getPartSize("year") * 100
}

class DateLine extends HTMLElement{

    get value(){
        return (this.right + this.left) / 2
    }

    get canvas(){
        return this.childNodes[0];
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

        this.style.width = "250px";
        this.style.height = "40px";
        this.style.display = "inline-block";

        const canvas = document.createElement("canvas");
        canvas.width = this.clientWidth;
        canvas.height = this.clientHeight;
        this.appendChild(canvas)

        this.zoom = 0
        this.onwheel = this.scrollZoom;

        this.redrawCanvas();
    }

    scrollZoom = function(e){
        e.preventDefault();

        // Still is the date where the cursor is, and so is the date that should stay in place
        var minX = this.canvas.getBoundingClientRect().left;
        var canvasX = e.clientX - minX;
        var relativeX = canvasX / this.canvas.clientWidth;
        var range = this.right - this.left;
        var still = this.left + range * relativeX;

        // Scroll sideways by scrolling horizontally
        var scroll;
        if(e.deltaX > 0){
            scroll = Math.min(e.deltaX * 0.002 * range, this.latest - this.right)
        }
        else {
            scroll = Math.max(e.deltaX * 0.002 * range, this.earliest - this.left)
        }
        still += scroll;

        // Zoom in by scrolling vertically
        // Then left and right dates should be moved, but limited to the earliest and latest dates
        var mult = 1.2 ** (e.deltaY * 0.01)
        this.left = Math.max(still - relativeX * range * mult, this.earliest);
        this.right = Math.min(still + (1 - relativeX) * range * mult, this.latest);

        

        this.redrawCanvas();
    }

    redrawCanvas = function(){
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "12px Arial"

        var l = new Date(this.left);
        var r = new Date(this.right);

        // Space is the amount of time in range on the canvas, and num and part are decided based on that
        var space = this.right - this.left;
        var spaceEntries = Object.entries(spaces);
        var spacing = spaceEntries.find((e) => e[1] > space / 5);
        var [num, part] = spacing[0].split(" ");
        num = parseInt(num)

        var leftPart = getPart(part, l)
        var rightPart = getPart(part, r)
        var firstPart = leftPart - (leftPart % num) + num;
        var lastPart = rightPart - (rightPart % num);

        var array = [...Array((lastPart - firstPart) / num + 1).keys()].map(n => firstPart + n * num);
        var dates = array.map(n => new Date(`${n}-01-01`));
        
        this.drawDates(ctx, l, r, dates, "year")
        ctx.fillText(new Date(this.value).getUTCFullYear(), this.canvas.width * 0.5, this.canvas.height * 0.25);

        this.dispatchEvent(new Event("change", {
            target: this
        }))
    }

    drawDates =  function(ctx, l, r, dates, part){
        ctx.textAlign = "center"
        ctx.fillStyle = "white"
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            switch(part){
                case "year": {
                    ctx.fillText(date.getUTCFullYear(), this.canvas.width * delta, this.canvas.height);
                    break;
                }
            }
        }
    }
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
        case "year": return 3.154e10;
        case "month": return 2.628e9;
        case "day": return 8.6407;
    }
}

function getPart(part, date){
    switch(part){
        case "year": return date.getUTCFullYear();
        case "month": return date.getUTCMonth();
        case "day": return date.getUTCDay();
    }
}

function setPart(part, date, value){
    switch(part){
        case "year": return date.setUTCFullYear(value);
        case "month": return date.setUTCMonth(value);
        case "day": return date.setUTCDay(value);
    }
    return date;
}

function getEveryMultiple(mag, part, left, right){
    var lower = getPart(left, part);
    var upper = getPart(right, part);

    if(upper > lower){
        var first = Math.ceil(lower / mag) * mag;
        var last = Math.ceil(upper / mag) * mag;

        var arr = new Array((last - first) / mag).map(num => num * mag + first);
        var dates = arr.map(num => setPart(part, new Date(left.valueOf()), num))
        return dates;
    }
}

module.exports = DateLine;
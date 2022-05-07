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
        return (this.right - this.left) / 2
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

        var minX = this.canvas.getBoundingClientRect().left;
        var canvasX = e.clientX - minX
        var pos = canvasX / this.canvas.clientWidth;
        var still = this.left + (this.right - this.left) * pos;

        var mult = 1.2 ** (e.deltaY * 0.01)


        this.left = Math.max(still + (this.left - still) * mult, this.earliest);
        this.right = Math.min(still + (this.right - still) * mult, this.latest);

        this.redrawCanvas();
    }

    redrawCanvas = function(){
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "12px Arial"

        var l = new Date(this.left);
        var r = new Date(this.right);

        var space = this.right - this.left;
        var spacing = Object.entries(spaces).find((e) => e[1] > space / 5);
        var [num, part] = spacing[0].split(" ");
        num = parseInt(num)

        var leftPart = getPart(part, l)
        var rightPart = getPart(part, r)
        var firstPart = leftPart - (leftPart % num) + num;
        var lastPart = rightPart - (rightPart % num);

        var array = [...Array((lastPart - firstPart) / num + 1).keys()].map(n => firstPart + n * num);
        var dates = array.map(n => new Date(`${n}-01-01`));
        
        this.drawDates(ctx, l, r, dates, "year")

        console.log(`Milliseconds: ${space}`)

        /*
        if(space > getPartSize("year") * 100) {
            console.log("Centuries")
            this.drawCenturies(ctx, l, r);
        }
        else if(space > getPartSize("year") * 10) {
            console.log("Decades")
        }
        else if(space > getPartSize("year")) {
            console.log("Years")
        }
        else if(space > getPartSize("month")) {
            console.log("Months")
        }
        else if(space > getPartSize("day") * 7) {
            console.log("Weeks")
        }
        else {
            console.log("Days")
        }
        */
    }

    drawCenturies = function(ctx, l, r){
        ctx.fillText(l.getUTCFullYear().toString(), 0, this.canvas.height);
        ctx.textAlign = "right"
        ctx.fillText(r.getUTCFullYear().toString(), this.canvas.width, this.canvas.height);
    }

    drawDates =  function(ctx, l, r, dates, part){
        ctx.textAlign = "center"
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
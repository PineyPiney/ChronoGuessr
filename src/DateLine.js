const spaces = [
    getPartSize("month"),
    getPartSize("month") * 3,
    getPartSize("month") * 6,
    getPartSize("year"), 
    getPartSize("year") * 2, 
    getPartSize("year") * 5, 
    getPartSize("year") * 10,
    getPartSize("year") * 20, 
    getPartSize("year") * 50, 
    getPartSize("year") * 100
]

class DateLine extends HTMLElement{

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

        var mult = 1.2 ** (e.deltaY * 0.01)
        this.right = this.left + (this.right - this.left) * mult;

        this.redrawCanvas();
    }

    redrawCanvas = function(){
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "12px Arial"

        var l = new Date(this.left);
        var r = new Date(this.right);

        var space = this.right - this.left;
        var delta = spaces.find(s => s > space / 3);

        console.log(`Milliseconds: ${space}`)
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
    }

    drawCenturies = function(ctx, l, r){
        ctx.fillText(l.getFullYear().toString(), 0, this.canvas.height);
        ctx.textAlign = "right"
        ctx.fillText(r.getFullYear().toString(), this.canvas.width, this.canvas.height);
    }

    drawDates =  function(ctx, l, r, dates, part){
        ctx.textAlign = "center"
        for(var date of dates){
            let delta = (date.getTime() - l.getTime()) / (r.getTime() - l.getTime());
            switch(part){
                case "year": {
                    ctx.fillText(date.getFullYear())
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
        case "year": return date.getFullYear();
        case "month": return date.getMonth();
        case "day": return date.getDay();
    }
}

function setPart(part, date, value){
    switch(part){
        case "year": return date.setFullYear(value);
        case "month": return date.setMonth(value);
        case "day": return date.setDay(value);
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
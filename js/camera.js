function Camera(canvas, resolution, focalLength) {
    this.ctx = canvas.getContext('2d');

    this.width = canvas.width = window.innerWidth * 0.4;
    this.height = canvas.height = window.innerHeight * 0.4;

    this.resolution = resolution;
    this.spacing = this.width / resolution;
    this.focalLength = focalLength || 0.8;
    this.range = 14;
    this.lightRange = 5;
    this.scale = (this.width + this.height) / 1700;
}

Camera.prototype.render = function(player, map) {
    this.drawSky(player.direction, map.light);
    this.drawColumns(player, map);
    this.drawWeapon(player.actualWeapon, player.paces);
};

Camera.prototype.drawSky = function(direction, ambient) {
    this.ctx.save();

    //this.ctx.globalAlpha = ambient * 0.9;

    this.ctx.fillStyle = '#2F3030';
    this.ctx.fillRect(0, 0, this.width, this.height * 0.5);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
    
    this.ctx.restore();
};

Camera.prototype.drawColumns = function(player, map) {
    this.ctx.save();
    for (var column = 0; column < this.resolution; column++) {
        var x = column / this.resolution - 0.5;
        var angle = Math.atan2(x, this.focalLength);
        var ray = map.cast(player, player.direction + angle, this.range);
        this.drawColumn(column, ray, angle, map);
    }
    this.ctx.restore();
};

Camera.prototype.drawWeapon = function(weapon, paces) {
    var bobX = Math.cos(paces * 2) * this.scale * 6;
    var bobY = Math.sin(paces * 4) * this.scale * 6;
    var left = this.width * 0.66 + bobX;
    var top = this.height * 0.6 + bobY;
    this.ctx.drawImage(weapon.bitmap.image, left, top, weapon.bitmap.width * this.scale, weapon.bitmap.height * this.scale);
};

Camera.prototype.drawColumn = function(column, ray, angle, map) {
    var ctx = this.ctx;
    var left = Math.floor(column * this.spacing);
    var width = Math.ceil(this.spacing);
    var hit = -1;
    var texture = undefined;

    while (++hit < ray.length && ray[hit].height <= 0);

    for (var s = ray.length - 1; s >= 0; s--) {
        var step = ray[s];

        if (s === hit) {
            if (step.height <= 0) continue;

            texture = map.wallTextures[step.elem_id];
            var textureX = Math.floor(texture.width * step.offset);
            var wall = this.project(step.height, angle, step.distance);

            ctx.globalAlpha = 1;
            ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);

            ctx.fillStyle = '#000000';
            ctx.globalAlpha = Math.max((step.distance / 2.5) / this.lightRange - map.light, 0);
            ctx.fillRect(left, wall.top, width, wall.height);
        }

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.15;
    }
};

Camera.prototype.project = function(height, angle, distance) {
    var z = distance * Math.cos(angle);
    var wallHeight = this.height * height / z;
    var bottom = this.height / 2 * (1 + 1 / z);
    return {
        top: bottom - wallHeight,
        height: wallHeight
    };
};
precision highp float;

varying vec2 vUV;

uniform vec4 area;
uniform float angle;
uniform float maxIter;
uniform float palette;
uniform float repeat;
uniform float speed;
uniform int symmetry;
uniform int displayUVs;
uniform float stripeFactor;
uniform float glow;

uniform sampler2D paletteTexture;
uniform float time;

vec2 rot(vec2 p, vec2 pivot, float a) {
    float s = sin(a);
    float c = cos(a);

    p -= pivot;
    p = vec2(p.x * c - p.y * s, p.x * s + p.y *c);
    p += pivot;

    return p;
}

void main(void) {

    vec2 uv = vUV - 0.5;

// uv += sin(uv*20.+time)*0.01;

    if (symmetry == 10) {
        uv.x = abs(uv.x);
    } else if (symmetry == 20) {
        uv.y = abs(uv.y);
    } else if (symmetry == 30) {
        uv = abs(uv);
    } else if (symmetry == 40) {
        uv = abs(uv);
        uv = rot(uv.xy, vec2(0.), .25 * 3.1415);
        uv = abs(uv);
    }

    vec2 c = area.xy + uv * area.zw;
    c = rot(c, area.xy, angle);

    float r = 20.;
    float r2 = r * r;

    vec2 z, zPrevious;
    float iter;
    for (iter = 0.; iter < maxIter; iter++) {
        zPrevious = rot(z, vec2(0.), time);

        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;

        if (dot(z, zPrevious) > r2) {
            break;
        }
    }

    float dist = length(z);
    float fracIter = (dist - r) / (r2 - r);
    fracIter = log2(log(dist) / log(r));

    iter -= fracIter;
    float m = sqrt(iter / maxIter);

    vec4 col;
    if (iter > maxIter) {
        col = vec4(0);
    } else {
        col = texture2D(paletteTexture, vec2(m * repeat + speed * time, palette));

        float angle = atan(z.x, z.y);
        col *= smoothstep(5., 0., fracIter);
        col *= vec4(vec3(1. + sin(angle * 2. + time * 4.) * stripeFactor), 1.);
        
        col *= glow;

        // float l = normalize(length(uv));
        // float a = smoothstep(1., 4., l);
        // col *= vec4(a, a, 0. , 1.);
        
        col *= 1. - dot(uv, uv);
    }



    if (displayUVs == 1) {
        col = vec4(uv.x, 0., 0., 1.);
    }

    gl_FragColor = col;
}

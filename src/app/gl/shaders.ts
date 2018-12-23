export const PARTICLE_VERTEX = `
    uniform sampler2D positionTexture;
    uniform sampler2D velocityTexture;

    attribute vec2 reference;

    void main() {
        vec3 particlePosition = texture2D( positionTexture, reference ).xyz;
        vec3 particleVelocity = texture2D( velocityTexture, reference ).xyz;

        float size = floor( fract( reference.x ) * 10.0 ) / 2.0;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( particlePosition.xyz, 1.0 );
        gl_PointSize = size;
    }
`;

export const PARTICLE_FRAGMENT = `
    const vec3 color = vec3( 1.0 );

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution;

        float percentToCenter = length( gl_PointCoord - vec2( 0.5 ) ) / 0.5;
        float alpha = 1.0 - smoothstep( 0.8, 1.0, percentToCenter );

        gl_FragColor = vec4( color, alpha );
    }
`;

export const DEFAULT_POSITION = `
    uniform sampler2D positionTexture;
    uniform sampler2D velocityTexture;
    uniform float respawn;

    uniform float delta;

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution;

        vec3 position = texture2D( positionTexture, uv ).xyz;
        vec3 velocity = texture2D( velocityTexture, uv ).xyz;

        position += velocity * delta;

        if ( respawn > 0.5 && position.y < -100.0 ) {
            gl_FragColor = vec4( -100.0 + fract( position.x ) * 200.0 , 100.0 + fract( uv.y ) * 200.0, position.z, 1.0);
        } else {
            gl_FragColor = vec4( max( vec3( -110 ), position ), 1.0 );
        }
    }
`;


print('importing "mod_74181.js"');

class mod_74181_internal_gp {
    constructor() {
        this.s = INPUT_VECTOR(4);
        this.a = INPUT();
        this.b = INPUT();

        this.g = OUTPUT();
        this.p = OUTPUT();

        let b_inv = NOT(this.b);

        this.g = NOR(AND( this.b, this.s[3], this.a ), AND( this.a, this.s[2], b_inv ));
        this.p = NOR(AND( b_inv, this.s[1] ), AND( this.s[0], this.b ), this.a);
    }

    set_s(s) {
        this.s[0].add_input(s[0]);
        this.s[1].add_input(s[1]);
        this.s[2].add_input(s[2]);
        this.s[3].add_input(s[3]);
    }

    set_a(a) { this.a.add_input(a); }
    set_b(b) { this.b.add_input(b); }

};

class IC_74181 {
    constructor() {

        this.S = INPUT_VECTOR(4);  // function select
        this.A = INPUT_VECTOR(4);  // A input
        this.B = INPUT_VECTOR(4);  // B input
        this.M        = INPUT();   // auxiliary select
        this.carry_in = INPUT();   // ... carry-in

        this.F = OUTPUT_VECTOR(4); // function output
        this.X         = OUTPUT(); // this and Y are related to generate/propagate
        this.Y         = OUTPUT(); // ^^
        this.A_eq_B    = OUTPUT(); // auxiliary output
        this.carry_out = OUTPUT(); // ^^

        let gp0 = new mod_74181_internal_gp();
        let gp1 = new mod_74181_internal_gp();
        let gp2 = new mod_74181_internal_gp();
        let gp3 = new mod_74181_internal_gp();

        gp0.set_s(this.S); gp0.set_a(this.A[0]); gp0.set_b(this.B[0]);
        gp1.set_s(this.S); gp1.set_a(this.A[1]); gp1.set_b(this.B[1]);
        gp2.set_s(this.S); gp2.set_a(this.A[2]); gp2.set_b(this.B[2]);
        gp3.set_s(this.S); gp3.set_a(this.A[3]); gp3.set_b(this.B[3]);

        let g0=gp0.g, g1=gp1.g, g2=gp2.g, g3=gp3.g;
        let p0=gp0.p, p1=gp1.p, p2=gp2.p, p3=gp3.p;

        let f_internal = [ null, null, null, null ];

        let m = NOT(this.M);

        f_internal[0] = XOR(NAND( this.carry_in, m ), g0, p0 );
        f_internal[1] = XOR(NOR(AND( this.carry_in, g0, m ), AND( p0, m )), p1, g1 );
        f_internal[2] = XOR(NOR(AND( this.carry_in, g0, g1, m ), AND( g1, p0, m ), AND( p1, m )), g2, p2 );
        f_internal[3] = XOR(NOR(AND( this.carry_in, g0, g1, g2, m ), AND( g1, g2, p0, m ), AND( g2, p1, m ), AND( p2, m )), g3, p3);

        let y_internal = OR( p3, AND( g3, p2 ), AND( g3, g2, p1 ), AND( g3, g2, g1, p0 ));

        this.X         = NAND( g3, g2, g1, g0 );
        this.Y         = NOT(y_internal);
        this.carry_out = OR( y_internal, AND( g3, g2, g1, this.carry_in ));
        this.A_eq_B    = Util.BITAND(f_internal);
        for(let i = 0; i < 4; i++)
            this.F[i] = f_internal[i];
    }

    set_S(sel) {
        this.S[0].add_input(sel[0]);
        this.S[1].add_input(sel[1]);
        this.S[2].add_input(sel[2]);
        this.S[3].add_input(sel[3]);
    }

    set_A(a) {
        this.A[0].add_input(a[0]);
        this.A[1].add_input(a[1]);
        this.A[2].add_input(a[2]);
        this.A[3].add_input(a[3]);
    }

    set_B(b) {
        this.B[0].add_input(b[0]);
        this.B[1].add_input(b[1]);
        this.B[2].add_input(b[2]);
        this.B[3].add_input(b[3]);
    }

    set_M(m) {
        this.M.add_input(m);
    }

    set_carry_in(cin) {
        this.carry_in.add_input(cin);
    }

};


function ic_74181_verify(a, b, f, cout, s, m, cin) {

    const select_value = 
        (s[0].output_value << 0) | 
        (s[1].output_value << 1) | 
        (s[2].output_value << 2) | 
        (s[3].output_value << 3);

    if(m.output_value === OUTPUT_ONE) {
        // logic functions

        switch(select_value) {
            case 0: // F = NOT(A)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - a[i].output_value), 'F = not(A)');
                break;
            case 1: // F = NOR(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - (a[i].output_value & b[i].output_value)), 'F = NAND(A, B)');
                break;
            case 2: // F = AND(NOT(A), B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === ((1 - a[i].output_value) & b[i].output_value), 'F = AND(NOT(A), B)');
                break;
            case 3: // F = 0
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === OUTPUT_ZERO, 'F = 0');
                break;
            case 4: // F = NAND(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - (a[i].output_value & b[i].output_value)), 'F = NAND(A, B)');
                break;
            case 5: // F = NOT(B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - b[i].output_value), 'F = NOT(B)');
                break;
            case 6: // F = XOR(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (a[i].output_value ^ b[i].output_value), 'F = XOR(A, B)');
                break;
            case 7: // F = NAND(A, NOT(B))
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - (a[i].output_value & (1 - b[i].output_value))), 'F = NAND(A, NOT(B))');
                break;
            case 8: // F = OR(NOT(A), B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === ((1 - a[i].output_value) | b[i].output_value), 'F = OR(NOT(A), B)');
                break;
            case 9: // F = XNOR(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (1 - (a[i].output_value ^ b[i].output_value)), 'F = XNOR(A, B)');    
                break;
            case 10: // F = B
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === b[i].output_value, 'F = B');
                break;
            case 11: // F = AND(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (a[i].output_value & b[i].output_value), 'F = AND(A, B)');
                break;
            case 12: // F = 1
                console.assert(f[0].output_value === OUTPUT_ONE,  'F = 1');
                console.assert(f[1].output_value === OUTPUT_ZERO, 'F = 1');
                console.assert(f[2].output_value === OUTPUT_ZERO, 'F = 1');
                console.assert(f[3].output_value === OUTPUT_ZERO, 'F = 1');
                break;
            case 13: // F = OR(A, NOT(B))
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (a[i].output_value | (1 - b[i].output_value)), 'F = OR(A, NOT(B))');
                break;
            case 14: // F = OR(A, B)
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === (a[i].output_value | b[i].output_value), 'F = OR(A, B)');
                break;
            case 15: // F = A
                for(let i = 0; i < 4; i++)
                    console.assert(f[i].output_value === a[i].output_value, 'F = A');
                break;
            default:
                console.trace();
                throw 'ic_74181_verify';
        }
    }
}



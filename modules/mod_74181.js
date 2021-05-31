
print('importing "mod_74181.js"');

class mod_74181_internal_gp {
    constructor() {
        this.s = INPUT_VECTOR(4);
        this.a = INPUT();
        this.b = INPUT();

        this.g = OUTPUT();
        this.p = OUTPUT();

        let b_inv = NOT();

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

class module_74181 {
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

        gp0.set_s(this.S);
        gp1.set_s(this.S);
        gp2.set_s(this.S);
        gp3.set_s(this.S);

        gp0.set_a(this.A[0]); gp0.set_b(this.B[0]);
        gp1.set_a(this.A[1]); gp1.set_b(this.B[1]);
        gp2.set_a(this.A[2]); gp2.set_b(this.B[2]);
        gp3.set_a(this.A[3]); gp3.set_b(this.B[3]);

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
        this.F         = f_internal;
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
        this.M = m;
    }

    set_carry_in(cin) {
        this.carry_in.add_input(cin);
    }

};

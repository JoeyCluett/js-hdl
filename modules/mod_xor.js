
print('importing "mod_xor.js"');

class module_xor {

    constructor() {

        this.A = INPUT();
        this.B = INPUT();
        this.Y = OUTPUT();

        let bottom = NAND();
        let top    = NAND();
        let left   = NAND();
        let right  = NAND();

        top.add_input(left, right);
        right.add_input(bottom, this.B);
        left.add_input(bottom, this.A);
        bottom.add_input(this.A, this.B);

        this.Y = top;
    }

    set_A(a) { this.A.add_input(a); }
    set_B(b) { this.B.add_input(b); }

};

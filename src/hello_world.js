

function hello_world() {

    let alu = new IC_74181();

    let SELECT = SIGNAL_VECTOR(4);
    let A      = SIGNAL_VECTOR(4);
    let B      = SIGNAL_VECTOR(4);
    let M      = SIGNAL(OUTPUT_ZERO);
    let CIN    = SIGNAL(OUTPUT_ZERO);
    
    alu.set_S(SELECT);
    alu.set_A(A);
    alu.set_B(B);
    alu.set_M(M);
    alu.set_carry_in(CIN);

    // verify and then we can start simulating
    hdl_env_verify();

    for(let s = 0; s < 16; s++) {
        for(let a = 0; a < 16; a++) {
            for(let b = 0; b < 16; b++) {

                Util.inplace_setvalue(SELECT, s);
                Util.inplace_setvalue(A, a);
                Util.inplace_setvalue(B, b);
                
                simulate(1);

                ic_74181_verify(
                    A, 
                    B, 
                    alu.F, 
                    alu.carry_out, 
                    SELECT, 
                    M, 
                    CIN);
            }
        }
    }

    print('testing complete');
}



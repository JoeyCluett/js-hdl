
print('importing "mod_sign_ext.js"');

class module_sign_extend {

    constructor(input_len, output_len) {
        this.input  = INPUT_VECTOR(input_len);
        this.output = OUTPUT_VECTOR(output_len);

        for(let i = 0; i < input_len-1; i++)
            this.output_vec[i] = this.input_vec[i];

        for(let i = input_len-1; i < output_len; i++)
            this.output_vec[i] = this.input_vec[input_len-1];
    }

    set_input(inp_vec) {
        for(let i = 0; i < inp_vec; i++)
            this.input[i].add_input(inp_vec[i]);
    }

};


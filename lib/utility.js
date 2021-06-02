
function print(txt) {
    console.log(txt);

    let print_div = document.getElementById('print_div');
    let para = document.createElement('p');
    let content = document.createTextNode(txt);
    para.style = "font-family:'Lucida Console', monospace;font-size:75%";
    para.appendChild(content);
    print_div.appendChild(para);
}

function string_to_logic_array(str) {
    
    let logic_arr = [];

    for(let i = 0; i < str.length; i++) {
        if(str[i] === '0') {
            logic_arr.push(ZERO());
        }
        else if(str[i] === '1') {
            logic_arr.push(ONE());
        }
        else {
            throw "invalid digit in '" + str + "'";
        }
    }

    return logic_arr.reverse();
}

class Util {

    //
    // expects lhs and rhs to be arrays of LogicGate or friends types
    // performs binary addition on two inputs. returns bitvector representing result
    //
    static bitvector_add(lhs, rhs) {

        console.assert(lhs.length === rhs.length);
        for(let i = 0; i < lhs.length; i++) {
            console.assert(lhs[i].output_value === OUTPUT_ZERO || lhs[i].output_value === OUTPUT_ONE, 'bit ' + i);
            console.assert(rhs[i].output_value === OUTPUT_ZERO || rhs[i].output_value === OUTPUT_ONE, 'bit ' + i);
        }

        let result = [];
        let CARRYIN = OUTPUT_ZERO;

        for(let i = 0; i < lhs.length; i++) {
            const tmp_val = lhs[i].output_value + rhs[i].output_value + CARRYIN;

            switch(tmp_val & 0x01) {
                case 0: result.push(ZERO()); break;
                case 1: result.push(ONE()); break;
            }

            if(tmp_val & 0x02) CARRYIN = OUTPUT_ONE;
            else CARRYIN = OUTPUT_ZERO;
        }

        if(CARRYIN) result.push(ONE());
        else result.push(ZERO());

        return result;
    }

    static bitvector_invert(vec) {

        vec.forEach(arg => {
            console.assert(arg.output_value === OUTPUT_ZERO || arg.output_value === OUTPUT_ONE);
        });

        let result = [];

        vec.forEach(arg => {
            switch(arg.output_value) {
                case OUTPUT_ZERO: result.push(ONE());  break;
                case OUTPUT_ONE:  result.push(ZERO()); break;
            }
        });
        return result;
    }

    static bitvector_negate(vec) {
        let vec_inv = bit_vector_invert(vec);
        return bit_vector_increment(vec_inv);
    }

    static bitvector_one(len) {
        let result = [ ONE() ];
        for(let i = 1; i < len; i++)
            result.push(ZERO());
        return result;
    }

    static bitvector_minus_one(len) {
        let result = [];
        for(let i = 0; i < len; i++)
            result.push(ONE());
        return result;
    }

    static bitvector_increment(vec) {
        let one_vec = bit_vector_one(vec.length);
        return bit_vector_add(vec, one_vec);
    }

    static bitvector_decrement(vec) {
        let minus_one = bit_vector_minus_one(vec.length);
        return bit_vector_add(vec, minus_one);
    }

    //
    // implements Double-Dabble algorithm on arbitrary bit set to calculate decimal value
    //
    static bitvector_to_decimal(bits) {

        bits.forEach(arg => {
            console.assert(arg.output_value === OUTPUT_ZERO || arg.output_value === OUTPUT_ONE); 
        });

        class result_nibble {

            constructor() {
                this.values = [ OUTPUT_ZERO, OUTPUT_ZERO, OUTPUT_ZERO, OUTPUT_ZERO ];
            }

            shift(input_value) {
                const shift_out_value = this.values[3];
                this.values[3] = this.values[2];
                this.values[2] = this.values[1];
                this.values[1] = this.values[0];
                this.values[0] = input_value;
                return shift_out_value;
            }

            check_and_add() {
                const decimal_value = 
                        (this.values[0] << 0) | 
                        (this.values[1] << 1) | 
                        (this.values[2] << 2) | 
                        (this.values[3] << 3);
                
                if(decimal_value > 4) {
                    const new_value = decimal_value + 3;
                    this.values[0] = (new_value >> 0) & 0x01;
                    this.values[1] = (new_value >> 1) & 0x01;
                    this.values[2] = (new_value >> 2) & 0x01;
                    this.values[3] = (new_value >> 3) & 0x01;
                }

                //return (new_value >> 4) & 0x01;
            }

            to_string() {
                const decimal_value = 
                        (this.values[0] << 0) | 
                        (this.values[1] << 1) | 
                        (this.values[2] << 2) | 
                        (this.values[3] << 3);
                return "" + String(decimal_value);
            }

        };

        let result_digits = [];
        let source_bits   = [];
        const src_top_idx = bits.length - 1;

        const n_digits = Math.ceil(bits.length / 3);
        for(let i = 0; i < n_digits; i++) { result_digits.push(new result_nibble()); }
        for(let i = 0; i < bits.length; i++) { source_bits.push(bits[i].output_value);}

        // actual double-dabble algorithm
        for(let i = 0; i < bits.length; i++) {
            let shift_value = source_bits[src_top_idx];

            for(let j = 0; j < result_digits.length; j++) {
                let tmp = result_digits[j].shift(shift_value);
                shift_value = tmp;
            }

            // dont check and add after the final iteration
            if(i !== bits.length-1)
                for(let j = 0; j < result_digits.length; j++) {
                    result_digits[j].check_and_add();
                }

            // shift source to the left
            for(let k = src_top_idx; k > 0; k--) {
                source_bits[k] = source_bits[k-1];
            }
            source_bits[0] = OUTPUT_ZERO;

        }

        // return string representation of decimal number
        let final_result = "";
        for(let i = 0; i < result_digits.length; i++) {
            final_result += result_digits[i].to_string();
        }

        // there has to be an easier way to reverse a stupid string
        final_result = final_result.split('').reverse().join('');

        while(final_result[0] === '0') {
            final_result = final_result.substring(1);
        }

        if(final_result === "") return "0";
        else return final_result;
    }

    static bitvector_to_string(vec) {
        let result = "";

        vec.forEach(arg => {
            switch(arg.output_value) {
                case OUTPUT_ZERO: result += "0"; break;
                case OUTPUT_ONE:  result += "1"; break;
                case OUTPUT_HI_Z: result += "z"; break;
                case OUTPUT_UND:  result += "u"; break;
            }
        });

        return result.split('').reverse().join('');
    }

    static inplace_increment(vec) {

        vec.forEach(arg => {
            console.assert(arg.output_value === OUTPUT_ZERO || arg.output_value === OUTPUT_ONE);
        });

        let CarryIn = OUTPUT_ONE;

        vec.forEach(arg => {
            const tmp_result = arg.output_value + CarryIn;
            arg.output_value = tmp_result & 0x01;
            CarryIn = (tmp_result >> 1) & 0x01;
        });
    }

    static inplace_decrement(vec) {

        vec.forEach(arg => {
            console.assert(arg.output_value === OUTPUT_ZERO || arg.output_value === OUTPUT_ONE);
        });

        let CarryIn = OUTPUT_ZERO;

        vec.forEach(arg => {
            const tmp_result = arg.output_value + OUTPUT_ONE + CarryIn;
            arg.output_value = tmp_result & 0x01;
            CarryIn = (tmp_result >> 1) & 0x01;
        });

    }

    static inplace_setvalue(vec, newval) {
        for(let i = 0; i < vec.length; i++) {
            const tmp_val = (newval >> i) & 0x01;
            vec[i].output_value = tmp_val;
        }
    }

    static BITAND(bitvec) {
        return Util.internal_bitlogic(AND(), bitvec);
    }

    static BITNAND(bitvec) {
        return Util.internal_bitlogic(NAND(), bitvec);
    }

    static BITOR(bitvec) {
        return Util.internal_bitlogic(OR(), bitvec);
    }

    static BITNOR(bitvec) {
        return Util.internal_bitlogic(NOR(), bitvec);
    }

    static internal_bitlogic(gate, bitvec) { 
        bitvec.forEach(el => {
            gate.add_input(el);
        });
        return gate;
    }

};

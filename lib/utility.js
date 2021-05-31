
function print(txt) {
    console.log(txt);

    let print_div = document.getElementById('print_div');
    let para = document.createElement('p');
    let content = document.createTextNode(txt);
    para.style = "font-family:'Lucida Console', monospace";
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

//
// expect 'bits' to be an array of LogicGate or friends types
// implements Double-Dabble algorithm on arbitrary bit set
//
function bits_to_decimal(bits) {

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

    return final_result;
}

class Util {

    static internal_bitlogic(gate, bitvec) { 
        bitvec.forEach(el => {
            gate.add_input(el);
        });
        return gate;
    }

    static BITAND(bitvec) {
        return Util.internal_bitlogic(AND(), bitvec);
    }

    static BITNAND(bitvec) {
        return Util.internal_bitlogic(NAND(), bitvec);
    }

    static BITOR(bitvec) {
        return Util.internal_bitlogic(AND(), bitvec);
    }

    static BITNOR(bitvec) {
        return Util.internal_bitlogic(NAND(), bitvec);
    }

};

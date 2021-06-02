
const AND_TYPE  = 0;
const NAND_TYPE = 1;
const OR_TYPE   = 2;
const NOR_TYPE  = 3;
const XOR_TYPE  = 4;
const XNOR_TYPE = 5;
const NOT_TYPE  = 6;

const FLIPFLOP_TYPE = 7;
const TRISTATE_TYPE = 8;
const WIRE_TYPE     = 9;
const FORWARD_TYPE  = 10;
const CONSTANT_TYPE = 11;
const SIGNAL_TYPE   = 12;

const OUTPUT_ZERO = 0;
const OUTPUT_ONE  = 1;
const OUTPUT_HI_Z = 2;
const OUTPUT_UND  = 3;

class GlobalHDL {
    static logic_list   = [];
    static forward_list = [];

    static const_zero = null;
    static const_one  = null;
    static const_hiz  = null;
    static const_und  = null;
};

class LogicGate {

    constructor(logic_type, ...args) {

        this.logic_type    = logic_type;
        this.output_value  = OUTPUT_ZERO;
        this.inputs        = [];
        this.fetched_value = OUTPUT_ZERO;

        this.add_input(...args);
    }

    fetch() {
        switch(this.logic_type) {
            case AND_TYPE:
            case NAND_TYPE:
                this.fetched_value = OUTPUT_ONE;
                for(let i = 0; i < this.inputs.length; i++) {
                    const output_value = this.inputs[i].output_value;
                    if(this.fetched_value === OUTPUT_ONE || this.fetched_value === OUTPUT_ZERO) {
                        if(output_value === OUTPUT_ONE || output_value === OUTPUT_ZERO) {
                            this.fetched_value &= output_value;
                        }
                        else {
                            this.fetched_value = OUTPUT_UND;
                            break;
                        }
                    }
                }

                if(this.logic_type === NAND_TYPE) {
                    // invert
                    switch(this.fetched_value) {
                        case OUTPUT_ZERO: this.fetched_value = OUTPUT_ONE;  break;
                        case OUTPUT_ONE:  this.fetched_value = OUTPUT_ZERO; break;
                        default: break; // hi-z and und should be affected
                    }
                }

                break;

            case OR_TYPE:
            case NOR_TYPE:
                this.fetched_value = OUTPUT_ZERO;
                for(let i = 0; i < this.inputs.length; i++) {
                    const output_value = this.inputs[i].output_value;
                    if(this.fetched_value === OUTPUT_ONE || this.fetched_value === OUTPUT_ZERO) {
                        if(output_value === OUTPUT_ONE || output_value === OUTPUT_ZERO) {
                            this.fetched_value |= output_value;
                        }
                        else {
                            this.fetched_value = OUTPUT_UND;
                            break;
                        }
                    }
                }

                if(this.logic_type === NOR_TYPE) {
                    // invert
                    switch(this.fetched_value) {
                        case OUTPUT_ZERO: this.fetched_value = OUTPUT_ONE;  break;
                        case OUTPUT_ONE:  this.fetched_value = OUTPUT_ZERO; break;
                        default: break;
                    }
                }

                break;

            case XOR_TYPE:
            case XNOR_TYPE:
                this.fetched_value = OUTPUT_ZERO;
                for(let i = 0; i < this.inputs.length; i++) {
                    const output_value = this.inputs[i].output_value;
                    if(this.fetched_value === OUTPUT_ONE || this.fetched_value === OUTPUT_ZERO) {
                        if(output_value === OUTPUT_ONE || output_value === OUTPUT_ZERO) {
                            this.fetched_value ^= output_value;
                        }
                        else {
                            this.fetched_value = OUTPUT_UND;
                            break;
                        }
                    }
                }

                if(this.logic_type === XNOR_TYPE) {
                    // invert
                    switch(this.fetched_value) {
                        case OUTPUT_ZERO: this.fetched_value = OUTPUT_ONE;  break;
                        case OUTPUT_ONE:  this.fetched_value = OUTPUT_ZERO; break;
                        default: break;
                    }
                }

                break;

            case NOT_TYPE:
                this.fetched_value = this.inputs[0].output_value;
                break;

            default:
                throw "unknown logic gate type";
        }
    }

    update() {
        if(this.output_value !== this.fetched_value) {            
            this.output_value = this.fetched_value;
            return 1;
        }
        else {
            return 0;
        }
    }

    add_input(...args) {
        args.forEach(arg => {
            if(this.logic_type !== NOT_TYPE)
                this.inputs.push(arg);
            else {
                if(this.inputs.length > 0)
                    throw "cannot add more than one input to NOT gate type";
                else
                    this.inputs.push(arg);
            }
        });
    }
};

class FlipFlopType {

    constructor() {
        this.output_value      = OUTPUT_ZERO;
        this.logic_type        = FLIPFLOP_TYPE;
        this.data_input_value  = OUTPUT_ZERO;
        this.prev_clk_value    = OUTPUT_ZERO;
        this.current_clk_value = OUTPUT_ZERO;
        
        this.clk_input  = null;
        this.data_input = null;
    }

    fetch() {
        this.current_clk_value = this.clk_input.output_value;
        this.data_input_value  = this.data_input.output_value;
    }

    update() {
        // rising edge only
        if(this.prev_clk_value === OUTPUT_ZERO && this.current_clk_value === OUTPUT_ONE) {
            this.prev_clk_value = this.current_clk_value;

            if(this.data_input_value === OUTPUT_ZERO || this.data_input_value === OUTPUT_ONE) {

                if(this.output_value !== this.data_input_value) {
                    this.output_value = this.data_input_value;
                    return 1;
                }
                else {
                    return 0;
                }

            }
            else {
                this.output_value = OUTPUT_UND;
                return 1;
            }
        }
        else {
            this.prev_clk_value = this.current_clk_value;
            return 0;
        }
    }

    set_clock(clk) {
        if(this.clk_input !== null) this.clk_input = clk;
        else throw "FlipFlopType : cannot set clock value more than once";
    }

    set_data(data) {
        if(this.data_input !== null) this.data_input = data;
        else throw "FlipFlopType : cannot set data value more than once";
    }

};

class TriStateBufferType {

    constructor() {
        this.output_value = OUTPUT_HI_Z;
        this.logic_type   = TRISTATE_TYPE;
        
        this.data_value   = OUTPUT_ZERO;
        this.select_value = OUTPUT_ZERO;
        
        this.data_input   = null;
        this.select_input = null;
    }

    fetch() {
        this.data_value = this.data_input.output_value;
        this.select_value = this.select_input.output_value;
    }

    update() {

        if(this.select_value === OUTPUT_ONE) {
            if(this.output_value !== this.data_value) {
                this.output_value = this.data_value;
                return 1;
            }
            else {
                return 0;
            }
        }
        else if(this.select_value === OUTPUT_ZERO) {
            if(this.output_value === OUTPUT_HI_Z) {
                return 0;
            }
            else {
                this.output_value = OUTPUT_HI_Z;
                return 1;
            }
        }
        else {
            this.output_value = OUTPUT_UND;
            return 1;
        }
    }

    set_data(data) {
        if(this.data_input === null) this.data_input = data;
        else throw "cannot set data input more than once";        
    }

    set_select(sel) {
        if(this.select_input === null) this.select_input = sel;
        else throw "cannot set select input more than once";
    }

    add_input(arg) {
        // no type other than forward should be calling this method
        console.assert(arg.logic_type === FORWARD_TYPE);
        internal_add_input(this, arg);
    }

};

class WireType {

    constructor(...args) {

        this.output_value  = OUTPUT_UND;
        this.logic_type    = WIRE_TYPE;
        this.inputs        = []
        this.fetched_value = OUTPUT_UND;

        args.forEach(arg => {
            this.inputs.push(arg);
        });
    }

    fetch() {

        this.fetched_value = OUTPUT_HI_Z;

        for(let i = 0; i < this.inputs.length; i++) {
            const arg_output = this.inputs[i].output_value;
            if(arg_output === OUTPUT_HI_Z) {
                continue;
            }
            else if(arg_output === OUTPUT_ZERO) {
                if(this.fetched_value === OUTPUT_HI_Z) {
                    this.fetched_value = OUTPUT_ZERO;
                }
                else {
                    this.fetched_value = OUTPUT_UND;
                    break;
                }
            }
            else if(arg_output === OUTPUT_ONE) {
                if(this.fetched_value === OUTPUT_HI_Z) {
                    this.fetched_value = OUTPUT_ONE;
                }
                else {
                    this.fetched_value = OUTPUT_UND;
                    break;
                }
            }
            else { // OUTPUT_UND
                this.fetched_value = OUTPUT_UND;
                break;
            }
        }

        this.output_value = this.fetched_value;
    }

    update() {
        return 0;
    }

    add_input(data) {
        this.inputs.push(data);
    }

};

class ConstantType {

    constructor(value) {
        this.output_value = value;
        this.logic_type   = CONSTANT_TYPE;
    }

};

class ForwardType {

    constructor() {
        this.logic_type    = FORWARD_TYPE;
        this.output_value  = OUTPUT_ZERO;
        this.fetched_value = OUTPUT_ZERO;
        this.source_gate   = null;
    }

    add_input(inp) {
        if(this.source_gate === null) this.source_gate = inp;
        else throw "ForwardType : cannot set source gate more than once";
    }

    fetch() {
        internal_evaluate_forward_chain(this, this.source_gate);
    }

    update() {
        if(this.output_value !== this.fetched_value) {
            this.output_value = this.fetched_value;
            return 1;
        }
        else return 0;
    }

};

class SignalType {

    constructor(starting_value) {

        if(starting_value === null)
            starting_value = OUTPUT_ZERO;

        this.logic_type = SIGNAL_TYPE;
        this.output_value = starting_value;
    }

    set_value(val) {
        this.output_value = val;
    }

};

//
// called by ForwardType to ensure source types are correctly evaluated 
// through arbitrarily long forward chains
//
function internal_evaluate_forward_chain(dest, src) {
    if(src instanceof ForwardType) {
        internal_evaluate_forward_chain(dest, src.source_gate);
    }
    else {
        dest.fetched_value = src.output_value;
    }
}

function internal_allocate_gate_of(logic_type, ...args) {
    let gate = new LogicGate(logic_type, ...args);
    GlobalHDL.logic_list.push(gate);
    return gate;
}

function AND(...args) {  return internal_allocate_gate_of(AND_TYPE,  ...args); }
function NAND(...args) { return internal_allocate_gate_of(NAND_TYPE, ...args); }
function OR(...args) {   return internal_allocate_gate_of(OR_TYPE,   ...args); }
function NOR(...args) {  return internal_allocate_gate_of(NOR_TYPE,  ...args); }
function XOR(...args) {  return internal_allocate_gate_of(XOR_TYPE,  ...args); }
function XNOR(...args) { return internal_allocate_gate_of(XNOR_TYPE, ...args); }
function NOT(...args) {  return internal_allocate_gate_of(NOT_TYPE,  ...args); }

function ZERO() { return GlobalHDL.const_zero; }
function ONE() {  return GlobalHDL.const_one; }
function HIZ() {  return GlobalHDL.const_hiz; }
function UND() {  return GlobalHDL.const_und; }

function CONST(val) {
    switch(val) {
        case OUTPUT_ZERO: return GlobalHDL.const_zero;
        case OUTPUT_ONE:  return GlobalHDL.const_one;
        case OUTPUT_HI_Z: return GlobalHDL.const_hiz;
        case OUTPUT_UND:  return GlobalHDL.const_und;
        default:
            throw "unknown value '" + val + "' in CONST"
    }
}

function TRISTATE_BUFFER() { 
    let tsbuf = new TriStateBufferType();
    GlobalHDL.logic_list.push(tsbuf);
    return tsbuf;
}

function FLIPFLOP() {
    let ff = new FlipFlopType();
    GlobalHDL.logic_list.push(ff);
    return ff;
}

function WIRE() {
    let w = new WireType();
    GlobalHDL.logic_list.push(w);
    return w;
}

function BUS() {
    return WIRE();
}

function FORWARD() {
    let fwd = new ForwardType();
    GlobalHDL.forward_list.push(fwd);
    return fwd;
}

function SIGNAL(starting_value) {
    let sig = new SignalType(starting_value);
    return sig;
}

function SIGNAL_VECTOR(len) {
    let sigvec = [];
    for(let i = 0; i < len; i++)
        sigvec.push(SIGNAL(OUTPUT_ZERO));
    return sigvec;
}

function INPUT() {
    return FORWARD();
}

function INPUT_VECTOR(len) {
    let inp_vec = [];
    for(let i = 0; i < len; i++)
        inp_vec.push(FORWARD());
    return inp_vec;
}

function OUTPUT() {
    // weird but helpful
    return null;
}

function OUTPUT_VECTOR(len) {
    let output_vec = [];
    for(let i = 0; i < len; i++)
        output_vec.push(null);
    return output_vec;
}

function internal_simulate_fetch() {

    // fully evaluate forward chains first
    GlobalHDL.forward_list.forEach(arg => {
        arg.fetch();
    });

    GlobalHDL.logic_list.forEach(arg => {
        if(
                arg instanceof LogicGate    || 
                arg instanceof FlipFlopType || 
                arg instanceof WireType     || 
                arg instanceof TriStateBufferType) {
            arg.fetch();
        }
    });
}

function internal_simulate_update() {

    let update_changes = 0;

    GlobalHDL.forward_list.forEach(arg => {
        update_changes += arg.update();
    });

    GlobalHDL.logic_list.forEach(arg => {
        if(
                arg instanceof LogicGate    || 
                arg instanceof FlipFlopType || 
                arg instanceof WireType     || 
                arg instanceof TriStateBufferType) {
            update_changes += arg.update();
        }
    });

    return update_changes;
}

function simulate(cycles) {

    for(let i = 0; i < cycles; i++) {

        let inner_fetch_update = true;

        while(inner_fetch_update) {
            internal_simulate_fetch();
            if(internal_simulate_update() === 0) {
                inner_fetch_update = false;
            }
        }
    }
}

function hdl_env_init() {

    print('initializing HDL environment...');

    GlobalHDL.const_zero = new ConstantType(OUTPUT_ZERO);
    GlobalHDL.const_one  = new ConstantType(OUTPUT_ONE);

    // why you would ever want/need hi-z or undefined constant is beyond me
    GlobalHDL.const_hiz  = new ConstantType(OUTPUT_HI_Z);
    GlobalHDL.const_und  = new ConstantType(OUTPUT_UND);

}

// optional function to run ensures certain logic types have fully-defined inputs
function hdl_env_verify() {

    print('verifying HDL environment...');

    GlobalHDL.logic_list.forEach(arg => {
        if(arg instanceof LogicGate) {
            console.assert(arg.inputs.length > 0, arg);   
        }
        else if(arg instanceof FlipFlopType) {
            console.assert(arg.clk_input !== null, arg);
            console.assert(arg.data_input !== null, arg);
        }
        else if(arg instanceof TriStateBufferType) {
            console.assert(arg.data_input !== null, arg);
            console.assert(arg.select_input !== null, arg);
        }
    });

    GlobalHDL.forward_list.forEach(arg => {
        console.assert(arg.logic_type === FORWARD_TYPE, arg);
        console.assert(arg.source_gate !== null, arg);
    });
}

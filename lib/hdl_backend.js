
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
                throw "undefined gate fetch";
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

            //console.log('adding input to gate');
            //console.log(arg);

            if(this.logic_type !== NOT_TYPE)
                this.inputs.push(arg);
            else {
                if(this.inputs.length > 0)
                    throw "cannot add more than one input to NOT gate type";
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
        if(this.prev_clk_value === OUTPUT_ZERO && this.current_clk_value === OUTPUT_ONE) {
            // rising edge only
            if(this.data_input_value === OUTPUT_ZERO || this.data_input_value === OUTPUT_ONE) {
                this.output_value = this.data_input_value;
            }
            else {
                return 0;
            }
        }

        this.prev_clk_value = this.current_clk_value;
    }

    set_clock(clk) {
        if(this.clk_input !== null) this.clk_input = clk;
        else throw "cannot set clock value more than once";
    }

    set_data(data) {
        if(this.data_input !== null) this.data_input = data;
        else throw "cannot set data value more than once";
    }

    add_input(data) { this.set_data(data); }

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

    add_input(data) {
        if(this.data_input === null) this.data_input = data;
        else throw "cannot set data input more than once";
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
    }

    update() {
        if(this.output_value !== this.fetched_value) {
            this.output_value = this.fetched_value;
            return 1;
        }
        else
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
        this.forward_gates = [];
        this.source_gate   = null;
    }

    add_input(inp) {
        if(this.source_gate === null) this.source_gate = inp;
        else throw "cannot set source gate more than once";
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

function internal_add_input(dest, src) {

    //
    // all types that call internal_add_input:
    //
    // LogicGate
    // WireType
    // ForwardType
    //
    // all other types have more specific methods for setting inputs
    //

    if(dest instanceof LogicGate && src instanceof LogicGate) {
        dest.inputs.push(src);
        return;
    }
    else if(dest instanceof LogicGate && src instanceof ForwardType) {
        // ForwardType holds references to downstream gates until src is set
        if(src.source_gate !== null) {

        }
        else {
            src.forward_gates.push(dest);
        }
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

    // default single cycle step
    if(cycles === null)
        cycles = 1;

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
    GlobalHDL.const_hiz  = new ConstantType(OUTPUT_HI_Z);
    GlobalHDL.const_und  = new ConstantType(OUTPUT_UND);

}

// optional function to run ensures certain logic types have fully-defined inputs
function hdl_env_verify() {

    print('verifying HDL environment...');

    GlobalHDL.logic_list.forEach(arg => {
        if(arg instanceof LogicGate) {
            console.assert(arg.inputs.length > 0);   
        }
        else if(arg instanceof FlipFlopType) {
            console.assert(arg.clk_input !== null);
            console.assert(arg.data_input !== null);
        }
        else if(arg instanceof TriStateBufferType) {
            console.assert(arg.data_input !== null);
            console.assert(arg.select_input !== null);
        }
    });

    GlobalHDL.forward_list.forEach(arg => {
        console.assert(arg.logic_type === FORWARD_TYPE);
        console.assert(arg.forward_gates.length > 0);
        console.assert(arg.source_gate !== null);
    });
}

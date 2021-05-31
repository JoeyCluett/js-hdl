
function main_setup() {

    hdl_env_init();
    //hdl_env_verify();

    /*
        let binary_string = "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
        let result_string = "7237005577332262213973186563042994240829374041602535252466099000494570602495";

        //let binary_string = "1111";
        //let result_string = "15";

        let logic_arr = string_to_logic_array(binary_string);
        let double_dabble_result = bits_to_decimal(logic_arr);

        print(result_string + " <= known");
        print(double_dabble_result + " <= calculated");
    */

    for(let i = 0; i < modules_list.length; i++) {
        let script_elem = document.createElement('script');
        script_elem.src = modules_list[i];
        script_elem.type = "text/javascript";
        document.body.appendChild(script_elem);
    }

}


const User=require("./user.js");


class Mahasiswa extends User{


    constructor(id,username,password,nim,nama){

        super(
            id,
            username,
            password,
            "mahasiswa"
        );


        this.nim=nim;
        this.nama=nama;

    }


}


module.exports=Mahasiswa;
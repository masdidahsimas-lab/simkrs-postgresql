class Kelas{


    constructor(
        id,
        namaKelas,
        dosen,
        jadwal,
        maksimal
    ){

        this.id=id;
        this.namaKelas=namaKelas;
        this.dosen=dosen;
        this.jadwal=jadwal;

        this.maksimal=maksimal;
        this.jumlahAmbil=0;

    }



    cekKapasitas(){

        return this.jumlahAmbil < this.maksimal;

    }



}


module.exports=Kelas;
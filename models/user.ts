//import {Entity} from "typeorm/decorator/entity/Entity";
import {Column, Entity, PrimaryColumn} from "typeorm";
/**
 * Created by Chris on 19.05.2017.
 */
@Entity()
export class User {
    @Column()
    email: string;
    @PrimaryColumn()
    username: string;
    @Column()
    password: string;
    @Column()
    admnin: boolean;
}
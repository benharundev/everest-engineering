import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Reservation } from '../../domain/entities/reservation.entity';
import { IReservationRepository } from '../../domain/interfaces/reservation-repository.interface';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';

@Injectable()
export class TypeOrmReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly repo: Repository<Reservation>,
  ) {}

  async findAll(
    status?: ReservationStatus,
    offset = 0,
    limit = 20,
  ): Promise<[Reservation[], number]> {
    return this.repo.findAndCount({
      where: status ? { status } : undefined,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async findById(id: string, manager?: EntityManager): Promise<Reservation | null> {
    const repo = manager ? manager.getRepository(Reservation) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async save(reservation: Reservation, manager?: EntityManager): Promise<Reservation> {
    const repo = manager ? manager.getRepository(Reservation) : this.repo;
    return repo.save(reservation);
  }

  async findByProductIdAndStatus(
    productId: string,
    status: ReservationStatus,
  ): Promise<Reservation[]> {
    return this.repo.find({ where: { productId, status } });
  }
}

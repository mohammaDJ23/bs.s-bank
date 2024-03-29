import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { map, Observable } from 'rxjs';
import { BillDto, ConsumerDto, DeletedBillDto, LocationDto, ReceiverDto } from 'src/dtos';
import { ClassConstructor, ListObj } from 'src/types';

export class ListSerializerInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<ListObj> {
    return handler.handle().pipe(
      map((data: ListObj) => {
        let [list, quantity] = data;
        list = list.map((item) => this.plainToClass(item));
        return [list, quantity];
      }),
    );
  }

  plainToClass(data: any) {
    return plainToClass(this.dto, data, {
      excludeExtraneousValues: true,
    });
  }
}

export class BillsSerializerInterceptor extends ListSerializerInterceptor {
  constructor() {
    super(BillDto);
  }
}

export class DeletedBillsSerializerInterceptor extends ListSerializerInterceptor {
  constructor() {
    super(DeletedBillDto);
  }
}

export class ConsumersSerializerInterceptor extends ListSerializerInterceptor {
  constructor() {
    super(ConsumerDto);
  }
}

export class ReceiversSerializerInterceptor extends ListSerializerInterceptor {
  constructor() {
    super(ReceiverDto);
  }
}

export class LocationsSerializerInterceptor extends ListSerializerInterceptor {
  constructor() {
    super(LocationDto);
  }
}

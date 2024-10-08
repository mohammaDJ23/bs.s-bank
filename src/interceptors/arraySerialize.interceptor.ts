import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { map, Observable } from 'rxjs';
import {
  LastYearDto,
  MostActiveConsumersDto,
  MostActiveLocationsByReceiversDto,
  MostActiveLocationsDto,
  MostActiveReceiversDto,
  MostActiveUsersDto,
} from 'src/dtos';
import { ClassConstructor } from 'src/types';

export class ArraySerializerInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any[]) => {
        return data.map((item) => this.plainToClass(item));
      }),
    );
  }

  plainToClass(data: any) {
    return plainToClass(this.dto, data, {
      excludeExtraneousValues: true,
    });
  }
}

export class LastYearBillsSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(LastYearDto);
  }
}

export class MostActiveUsersSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(MostActiveUsersDto);
  }
}

export class MostActiveConsumersSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(MostActiveConsumersDto);
  }
}

export class MostActiveLocationsSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(MostActiveLocationsDto);
  }
}

export class MostActiveLocationsByReceiversSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(MostActiveLocationsByReceiversDto);
  }
}

export class MostActiveReceiversSerializerInterceptor extends ArraySerializerInterceptor {
  constructor() {
    super(MostActiveReceiversDto);
  }
}

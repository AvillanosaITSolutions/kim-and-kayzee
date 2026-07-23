import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { QueryGuestsDto } from './dto/query-guests.dto';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guests: GuestsService) {}

  @Get()
  findAll(@Query() query: QueryGuestsDto) {
    return this.guests.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.guests.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guests.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGuestDto) {
    return this.guests.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuestDto) {
    return this.guests.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.guests.remove(id);
  }
}
